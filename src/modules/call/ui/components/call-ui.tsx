import { useState } from "react";
import { StreamTheme, useCall } from "@stream-io/video-react-sdk";

import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props {
  meetingName: string;
}

export const CallUi = ({ meetingName }: Props) => {
  const call = useCall();

  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
  const [joining, setJoining] = useState(false);

  const handleJoin = async () => {
    if (!call || joining) return;

    try {
      setJoining(true);

      console.log("callingState:", call.state.callingState);

      if (call.state.callingState !== "idle") {
        return;
      }

      await call.join({ create: true });

      setShow("call");
    } catch (error) {
      console.error("JOIN ERROR:", error);
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!call) return;

    await call.leave();

    setShow("ended");
  };

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} />}

      {show === "call" && (
        <CallActive onLeave={handleLeave} meetingName={meetingName} />
      )}

      {show === "ended" && <CallEnded />}
    </StreamTheme>
  );
};
