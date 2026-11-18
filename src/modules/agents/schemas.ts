import { z } from "zod";

export const agentInsertSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  instructions: z.string().trim().min(1, "Instructions are required").max(4000),
});

export const agentsUpdateSchema = agentInsertSchema.extend({
  id: z.string().min(1),
});
