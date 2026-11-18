"use client";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";
import { LoadingState } from "@/components/loading-state";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { useState } from "react";
import { UpcomingState } from "../components/upcoming-state";
import { CancelledState } from "../components/cancelled-state";
import { ProcessingState } from "../components/processing-state";
interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Are you sure ? ",
    "The following action will remove this meeting",
  );

  const { data } = useSuspenseQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId }),
  );

  const transition = useMutation(
    trpc.meetings.transition.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(trpc.meetings.getOne.queryOptions({ id: meetingId })),
          queryClient.invalidateQueries(trpc.meetings.getMany.pathFilter()),
        ]);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const removeMeeting = useMutation(
    trpc.meetings.remove.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.meetings.getMany.queryOptions({}));
        router.push("/meetings");
      },
    }),
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeMeeting.mutateAsync({ id: meetingId });
  };

  const isActive = data.status === "active";
  const isUpcoming = data.status === "upcoming";
  const isCancelled = data.status === "cancelled";
  const isCompleted = data.status === "completed";
  const isProcessing = data.status === "processing";

  return (
    <>
      {RemoveConfirmation}
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={data.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />
        {isCancelled && <CancelledState />}
        {isUpcoming && (
          <UpcomingState
            onStart={() => transition.mutate({ id: meetingId, action: "start" })}
            onCancelMeeting={() => transition.mutate({ id: meetingId, action: "cancel" })}
            isCancelling={transition.isPending}
          />
        )}
        <section className="rounded-lg border bg-white px-4 py-5">
          <h2 className="text-lg font-semibold">Agenda</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Agent: <Link className="underline" href={`/agents/${data.agent.id}`}>{data.agent.name}</Link>
          </p>
          <p className="mt-2 whitespace-pre-wrap">{data.instructions || "No agenda added."}</p>
        </section>
        {isCompleted && (
          <section className="rounded-lg border bg-white px-4 py-5">
            <h2 className="text-lg font-semibold">Meeting completed</h2>
            <h3 className="mt-3 font-medium">Meeting notes</h3>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{data.summary || "No notes were saved."}</p>
          </section>
        )}
        {isProcessing && <ProcessingState />}
        {isActive && (
          <section className="space-y-4 rounded-lg border bg-white px-4 py-5">
            <h2 className="text-lg font-semibold">Meeting in progress</h2>
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              transition.mutate({ id: meetingId, action: "finish", notes });
            }}>
              <label className="block font-medium" htmlFor="meeting-notes">Meeting notes</label>
              <Textarea id="meeting-notes" value={notes} maxLength={8000}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Record decisions and next steps before finishing." />
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={transition.isPending}>Finish meeting</Button>
                {data.videoEnabled && (
                  <Button variant="outline" asChild>
                    <Link href={`/call/${meetingId}`}>Open video room</Link>
                  </Button>
                )}
              </div>
            </form>
          </section>
        )}
      </div>
    </>
  );
};
export const MeetingIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading meeting..."
      description="This may take a few seconds"
    />
  );
};

export const MeetingIdViewError = () => {
  return (
    <ErrorState
      title="Error Loading Meeting"
      description="Please try again later"
    />
  );
};
