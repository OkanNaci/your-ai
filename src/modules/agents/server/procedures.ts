import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { agentInsertSchema } from "@/modules/agents/schemas";
import { z } from "zod";
import { eq, getTableColumns, sql, and, ilike, desc, count } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { agentsUpdateSchema } from "../schemas";
import { askAgent } from "./ask-agent";
const meetingCount = sql<number>`(select count(*) from ${meetings} as owned_meeting
  where owned_meeting.agent_id = ${agents.id} and owned_meeting.user_id = ${agents.userId})`
  .mapWith(Number);

export const agentsRouter = createTRPCRouter({
  ask: protectedProcedure
    .input(z.object({ id: z.string(), question: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const [agent] = await db.select({ instructions: agents.instructions }).from(agents)
        .where(and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)));
      if (!agent) throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found." });
      return askAgent(agent.instructions, input.question);
    }),
  update: protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedAgent] = await db
        .update(agents)
        .set(input)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)),
        )
        .returning();
      if (!updatedAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }
      return updatedAgent;
    }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedAgent] = await db
        .delete(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)),
        )
        .returning();
      if (!removedAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }
      return removedAgent;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingAgent] = await db
        .select({
          meetingCount,
          ...getTableColumns(agents),
        })
        .from(agents)
        .where(
          and(eq(agents.id, input.id), eq(agents.userId, ctx.auth.user.id)),
        );
      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }

      return { ...existingAgent, playgroundEnabled: Boolean(process.env.OPENAI_API_KEY?.trim()) };
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
      }),
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize } = input;
      const data = await db

        .select({
          meetingCount,
          ...getTableColumns(agents),
        })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined,
          ),
        )
        .orderBy(desc(agents.createdAt), desc(agents.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({
          count: count(),
        })
        .from(agents)
        .where(
          and(
            eq(agents.userId, ctx.auth.user.id),
            search ? ilike(agents.name, `%${search}%`) : undefined,
          ),
        );
      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
  create: protectedProcedure
    .input(agentInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdAgent] = await db
        .insert(agents)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();
      return createdAgent;
    }),
});
