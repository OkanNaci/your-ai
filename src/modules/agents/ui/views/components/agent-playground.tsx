"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";

export function AgentPlayground({ agentId, enabled }: { agentId: string; enabled: boolean }) {
  const [question, setQuestion] = useState("");
  const trpc = useTRPC();
  const reply = useMutation(trpc.agents.ask.mutationOptions());

  return (
    <section className="space-y-4 rounded-lg border bg-card p-5">
      <h2 className="text-lg font-semibold">Agent playground</h2>
      {enabled ? (
        <>
          <form className="space-y-3" onSubmit={(event) => {
            event.preventDefault();
            const prompt = question.trim();
            if (prompt && !reply.isPending) reply.mutate({ id: agentId, question: prompt });
          }}>
            <label htmlFor="agent-question" className="block font-medium">Ask a question</label>
            <Textarea id="agent-question" value={question} maxLength={2000}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What should we prepare before our next meeting?" />
            <Button disabled={reply.isPending || !question.trim()}>
              {reply.isPending ? "Waiting for answer…" : "Ask agent"}
            </Button>
          </form>
          {reply.error && <p role="alert" className="text-destructive">{reply.error.message}</p>}
          <div role="status">
            {reply.data && (
              <p className="rounded-md border bg-muted p-4 whitespace-pre-wrap break-words">
                {reply.data.answer}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Text replies are unavailable until the workspace administrator connects OpenAI.
        </p>
      )}
    </section>
  );
}
