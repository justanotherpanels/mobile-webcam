"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useWebRTC } from "@/hooks/useWebRTC";

export default function CameraOnlyPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const { localStreamRef, remoteStreams, startLocalStream, isConnected } =
    useWebRTC({ roomId });

  useEffect(() => {
    const init = async () => {
      const stream = await startLocalStream();
      if (stream) {
        setLocalStream(stream);
      }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full h-full">
        {localStream && (
          <VideoPlayer stream={localStream} isLocal name="" />
        )}
      </div>
    </div>
  );
}
