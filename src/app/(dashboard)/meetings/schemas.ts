import { z } from "zod";

export const meetingsInsertSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  agentId: z.string().min(1, "Agent is required"),
  instructions: z.string().trim().max(4000),
});

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
  id: z.string().min(1),
});
