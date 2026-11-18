import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

interface Props {
  onStart: () => void;
  onCancelMeeting: () => void;
  pending: boolean;
}

export const UpcomingState = ({ onStart, onCancelMeeting, pending }: Props) => (
  <section className="flex flex-col items-center gap-5 rounded-lg border bg-card p-5">
    <EmptyState image="/upcoming.svg" title="Ready to start?"
      description="Start the meeting when you are ready to capture decisions and next steps." />
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="outline" onClick={onCancelMeeting} disabled={pending}>Cancel meeting</Button>
      <Button onClick={onStart} disabled={pending}>Start meeting</Button>
    </div>
  </section>
);
