import "server-only";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const chatResponse = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().nullable() }),
  })),
});

function textProvider(): { url: string; model: string; headers: Record<string, string> } | null {
  if (process.env.AGENT_TEXT_PROVIDER === "local") {
    const port = Number(process.env.LOCAL_AI_PORT ?? 11434);
    if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
    return {
      url: "http://127.0.0.1:" + port + "/v1/chat/completions",
      model: process.env.LOCAL_AI_MODEL || "qwen2.5:0.5b",
      headers: { "Content-Type": "application/json" },
    };
  }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_WORKERS_AI_TOKEN?.trim();
  if (process.env.AGENT_TEXT_PROVIDER !== "cloudflare" || !token || !account || !/^[a-f0-9]{32}$/i.test(account)) {
    return null;
  }
  return {
    url: "https://api.cloudflare.com/client/v4/accounts/" + account + "/ai/v1/chat/completions",
    model: "@cf/meta/llama-3.1-8b-instruct",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
  };
}

export function hasAgentTextProvider() {
  return textProvider() !== null;
}

export async function askAgent(instructions: string, question: string) {
  const provider = textProvider();
  if (!provider) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Text replies are unavailable because no model is configured." });
  }

  try {
    const response = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: question },
        ],
        max_tokens: 256,
        stream: false,
      }),
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "The AI service is busy or has reached its usage limit. Try again later." });
    }
    if (!response.ok) throw new Error("Text provider request failed");

    const answer = chatResponse.parse(await response.json()).choices[0]?.message.content?.trim();
    if (!answer) throw new Error("The model returned no text");
    return { answer };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new TRPCError({ code: "TIMEOUT", message: "The agent took too long to answer. Try again." });
    }
    throw new TRPCError({ code: "BAD_GATEWAY", message: "The AI service could not answer. Try again later." });
  }
}
