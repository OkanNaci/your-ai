import {
  AgentsView,
  AgentsViewError,
} from "@/modules/agents/ui/views/agents.view";
import { getQueryClient, trpc } from "@/trpc/server";
import { Suspense } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { LoadingState } from "@/components/loading-state";
import { ErrorBoundary } from "react-error-boundary";
import { AgentsListHeader } from "@/modules/agents/ui/views/components/agents-list-header";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());
  return (
    <>
      <AgentsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense
          fallback={
            <LoadingState
              title="Loading Agents"
              description="This may take a few seconds"
            />
          }
        >
          <ErrorBoundary fallback={<AgentsViewError />}>
            <AgentsView />
          </ErrorBoundary>
        </Suspense>
      </HydrationBoundary>
    </>
  );
};
export default Page;
