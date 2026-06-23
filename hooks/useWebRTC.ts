import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { createPeerConnection } from "@/lib/webrtc";

interface UseWebRTCProps {
  roomId: string;
}

export const useWebRTC = ({ roomId }: UseWebRTCProps) => {
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const socket = io("http://localhost:3001");
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("user-joined", async (userId: string) => {
      const pc = createPeerConnection(
        (candidate) => {
          if (candidate) {
            socket.emit("ice-candidate", { targetId: userId, candidate });
          }
        },
        (event) => {
          const stream = event.streams[0];
          setRemoteStreams((prev) => new Map(prev).set(userId, stream));
        }
      );

      peerConnectionsRef.current.set(userId, pc);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { targetId: userId, offer });
    });

    socket.on("offer", async ({ offer, fromId }: { offer: RTCSessionDescriptionInit; fromId: string }) => {
      const pc = createPeerConnection(
        (candidate) => {
          if (candidate) {
            socket.emit("ice-candidate", { targetId: fromId, candidate });
          }
        },
        (event) => {
          const stream = event.streams[0];
          setRemoteStreams((prev) => new Map(prev).set(fromId, stream));
        }
      );

      peerConnectionsRef.current.set(fromId, pc);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { targetId: fromId, answer });
    });

    socket.on("answer", async ({ answer, fromId }: { answer: RTCSessionDescriptionInit; fromId: string }) => {
      const pc = peerConnectionsRef.current.get(fromId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("ice-candidate", async ({ candidate, fromId }: { candidate: RTCIceCandidateInit; fromId: string }) => {
      const pc = peerConnectionsRef.current.get(fromId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("user-left", (userId: string) => {
      const pc = peerConnectionsRef.current.get(userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(userId);
        return newStreams;
      });
    });

    return () => {
      socket.disconnect();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
    };
  }, [roomId]);

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      return null;
    }
  };

  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  };

  return {
    localStreamRef,
    remoteStreams,
    isConnected,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
  };
};
