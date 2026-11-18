import { useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";

interface Props {
  meetingId: string;
  meetingName: string;
}

export const CallUi = ({ meetingId, meetingName }: Props) => {
  const call = useCall();
  const router = useRouter();
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);

  async function join() {
    if (!call || joining) return;
    setJoining(true);
    try {
      await call.join();
      setJoined(true);
    } catch {
      toast.error("Could not join the video room. Please try again.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <StreamTheme className="h-full">
      {joined ? (
        <CallActive meetingName={meetingName} onLeave={() => router.push(`/meetings/${meetingId}`)} />
      ) : (
        <CallLobby onJoin={join} joining={joining} />
      )}
    </StreamTheme>
  );
};
