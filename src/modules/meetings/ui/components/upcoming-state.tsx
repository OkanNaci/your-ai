import { EmptyState } from "@/components/empty-state";
import { VideoIcon, BanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  onStart: () => void;
  onCancelMeeting: () => void;
  isCancelling: boolean;
}

export const UpcomingState = ({
  onStart,
  onCancelMeeting,
  isCancelling,
}: Props) => {
  return (
    <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
      <EmptyState
        image="/upcoming.svg"
        title="Not started yet"
        description="Start the meeting when you are ready to capture decisions and next steps."
      />
      <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
        <Button
          onClick={onCancelMeeting}
          variant="secondary"
          className="w-full lg:w-auto"
          disabled={isCancelling}
        >
          <BanIcon />
          Cancel Meeting
        </Button>
        <Button disabled={isCancelling} onClick={onStart} className="w-full lg:w-auto">
          <VideoIcon />
          Start Meeting
        </Button>
      </div>
    </div>
  );
};
