import { z } from "zod";

export const meetingsInsertSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  agentId: z.string().min(1, { message: "Agent is required" }),
  userId: z.string().min(1, { message: "User ID is required" }),
  instructions: z.string().min(1, { message: "Instructions are required" }),
  // Add any other fields mentioned in "9 more" section of your error
});

export const meetingsUpdateSchema = meetingsInsertSchema.extend({
  id: z.string().min(1, { message: "ID is required" }),
});
