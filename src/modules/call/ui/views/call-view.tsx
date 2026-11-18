"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/error-state";
import { CallProvider } from "../components/call-provider";
interface Props {
  meetingId: string;
}

export const CallView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId }),
  );
  if (data.status !== "active" || !data.videoEnabled) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ErrorState
          title="Video room unavailable"
          description="Video requires an active meeting and a configured Stream account."
        />
      </div>
    );
  }

  return <CallProvider meetingId={meetingId} meetingName={data.name} />;
};
