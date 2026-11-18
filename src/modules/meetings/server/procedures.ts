import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { z } from "zod";
import { eq, getTableColumns, and, ilike, desc, count, sql } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "@/app/(dashboard)/meetings/schemas";
import { MeetingStatus } from "../types";
import { streamVideo } from "@/lib/stream-video";
const ownedMeeting = (id: string, userId: string) =>
  and(eq(meetings.id, id), eq(meetings.userId, userId));

async function requireOwnedAgent(id: string, userId: string) {
  const [agent] = await db.select({ id: agents.id }).from(agents)
    .where(and(eq(agents.id, id), eq(agents.userId, userId)));
  if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found." });
}

const duration = sql<number | null>`EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))`
  .mapWith((value: string | null) => value === null ? null : Number(value))
  .as("duration");
export const meetingsRouter = createTRPCRouter({
  generateToken: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.auth.user;
      const [meeting] = await db.select().from(meetings)
        .where(and(ownedMeeting(input.id, user.id), eq(meetings.status, "active")));
      if (!meeting) throw new TRPCError({ code: "NOT_FOUND", message: "Active meeting not found." });
      if (!streamVideo) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Video is not configured." });

      await streamVideo.upsertUsers([{ id: user.id, name: user.name, role: "user" }]);
      const call = streamVideo.video.call("default", meeting.id);
      await call.getOrCreate({
        data: { created_by_id: user.id, members: [{ user_id: user.id }] },
      });
      return streamVideo.generateCallToken({ user_id: user.id, call_cids: [call.cid], validity_in_seconds: 3600 });
    }),
  transition: protectedProcedure
    .input(z.discriminatedUnion("action", [
      z.object({ id: z.string(), action: z.literal("start") }),
      z.object({ id: z.string(), action: z.literal("cancel") }),
      z.object({ id: z.string(), action: z.literal("finish"), notes: z.string().trim().max(8000) }),
    ]))
    .mutation(async ({ input, ctx }) => {
      const now = new Date();
      const changes =
        input.action === "start" ? { status: "active" as const, startedAt: now }
        : input.action === "cancel" ? { status: "cancelled" as const }
        : { status: "completed" as const, endedAt: now, summary: input.notes || null };

      const [meeting] = await db.update(meetings).set({ ...changes, updatedAt: now })
        .where(and(
          ownedMeeting(input.id, ctx.auth.user.id),
          eq(meetings.status, input.action === "finish" ? "active" : "upcoming"),
        )).returning();
      if (!meeting) {
        throw new TRPCError({ code: "CONFLICT", message: "This meeting is no longer in the expected state. Refresh and try again." });
      }
      return meeting;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)),
        )
        .returning();
      if (!removedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return removedMeeting;
    }),
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input: { id, ...details }, ctx }) => {
      await requireOwnedAgent(details.agentId, ctx.auth.user.id);
      const [updatedMeeting] = await db
        .update(meetings)
        .set({ ...details, updatedAt: new Date() })
        .where(ownedMeeting(id, ctx.auth.user.id))
        .returning();
      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return updatedMeeting;
    }),
  create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      await requireOwnedAgent(input.agentId, ctx.auth.user.id);
      const [meeting] = await db.insert(meetings).values({
        ...input,
        userId: ctx.auth.user.id,
      }).returning();
      return meeting;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration,
        })
        .from(meetings)
        .innerJoin(agents, and(eq(meetings.agentId, agents.id), eq(meetings.userId, agents.userId)))
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id)),
        );
      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return { ...existingMeeting, videoEnabled: Boolean(streamVideo) };
    }),
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        agentId: z.string().nullish(),
        status: z.nativeEnum(MeetingStatus).nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize, status, agentId } = input;

      const data = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration,
        })
        .from(meetings)
        .innerJoin(agents, and(eq(meetings.agentId, agents.id), eq(meetings.userId, agents.userId)))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined,
          ),
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({
          count: count(),
        })
        .from(meetings)
        .innerJoin(agents, and(eq(meetings.agentId, agents.id), eq(meetings.userId, agents.userId)))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined,
          ),
        );
      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
});
