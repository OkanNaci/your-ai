import "server-only";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const outputSchema = z.object({
  output: z.array(z.object({
    type: z.string(),
    content: z.array(z.object({
      type: z.string(),
      text: z.string().optional(),
      refusal: z.string().optional(),
    })).optional(),
  })),
});

export async function askAgent(instructions: string, question: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Text replies are unavailable because OpenAI is not configured." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions,
        input: question,
        ...(process.env.OPENAI_MODEL ? {} : { reasoning: { effort: "minimal" } }),
        max_output_tokens: 700,
        store: false,
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The AI service is busy or has reached its usage limit. Try again later." });
    }
    if (!response.ok) throw new Error("OpenAI request failed");

    const result = outputSchema.parse(await response.json());
    const answer = result.output
      .filter((item) => item.type === "message")
      .flatMap((item) => item.content ?? [])
      .map((part) => part.type === "output_text" ? part.text : part.refusal)
      .filter(Boolean)
      .join("\n")
      .trim();
    if (!answer) throw new Error("OpenAI returned no text");
    return { answer };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new TRPCError({ code: "TIMEOUT", message: "The agent took too long to answer. Try again." });
    }
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI service could not answer. Try again later." });
  }
}
