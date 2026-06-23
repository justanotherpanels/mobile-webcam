import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { createPeerConnection } from "@/lib/webrtc";

interface UseWebRTCProps {
  roomId: string;
}

export type RtmpStatus = "idle" | "connecting" | "streaming" | "stopped" | "error";

export const useWebRTC = ({ roomId }: UseWebRTCProps) => {
  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const iceRestartTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [rtmpStatus, setRtmpStatus] = useState<RtmpStatus>("idle");
  const [rtmpError, setRtmpError] = useState<string | null>(null);

  const performIceRestart = useCallback(async (userId: string, pc: RTCPeerConnection) => {
    const socket = socketRef.current;
    if (!socket || pc.signalingState === "closed") return;

    try {
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      socket.emit("offer", { targetId: userId, offer });
    } catch (e) {
      console.error("ICE restart failed:", e);
    }
  }, []);

  const handleIceConnectionStateChange = useCallback(
    (userId: string, pc: RTCPeerConnection, state: RTCIceConnectionState) => {
      const existingTimer = iceRestartTimersRef.current.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        iceRestartTimersRef.current.delete(userId);
      }

      if (state === "failed") {
        performIceRestart(userId, pc);
      } else if (state === "disconnected") {
        const timer = setTimeout(() => {
          if (
            pc.iceConnectionState === "disconnected" ||
            pc.iceConnectionState === "failed"
          ) {
            performIceRestart(userId, pc);
          }
        }, 3000);
        iceRestartTimersRef.current.set(userId, timer);
      }
    },
    [performIceRestart]
  );

  const makePeerConnection = useCallback(
    (userId: string, socket: Socket) => {
      let pc: RTCPeerConnection;
      pc = createPeerConnection(
        (candidate) => {
          if (candidate) {
            socket.emit("ice-candidate", { targetId: userId, candidate });
          }
        },
        (event) => {
          const stream = event.streams[0];
          setRemoteStreams((prev) => new Map(prev).set(userId, stream));
        },
        (state) => handleIceConnectionStateChange(userId, pc, state)
      );
      peerConnectionsRef.current.set(userId, pc);
      return pc;
    },
    [handleIceConnectionStateChange]
  );

  useEffect(() => {
    if (!roomId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:8080"
        : "https://mobile-webcam-production.up.railway.app");
    
    const socket = io(socketUrl, {
      transports: ["polling", "websocket"],
      upgrade: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });
    socketRef.current = socket;
    const peerConnections = peerConnectionsRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);
      socket.emit("join-room", roomId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
      setConnectionError(error.message || "Gagal terhubung ke signaling server");
    });

    socket.on("rtmp-started", () => {
      setRtmpStatus("streaming");
      setRtmpError(null);
    });

    socket.on("rtmp-stopped", () => {
      setRtmpStatus("stopped");
    });

    socket.on("rtmp-error", (err: string) => {
      setRtmpStatus("error");
      setRtmpError(err);
    });

    socket.on("user-joined", async (userId: string) => {
      const isInitiator = (socket.id || "") > userId;

      let pc = peerConnectionsRef.current.get(userId);
      if (!pc) {
        pc = makePeerConnection(userId, socket);
      }

      if (isInitiator) {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc!.addTrack(track, localStreamRef.current!);
          });
        } else {
          pc!.addTransceiver('video', { direction: 'recvonly' });
          pc!.addTransceiver('audio', { direction: 'recvonly' });
        }

        try {
          const offer = await pc!.createOffer();
          await pc!.setLocalDescription(offer);
          socket.emit("offer", { targetId: userId, offer });
        } catch (e) {
          console.error("Error creating offer:", e);
        }
      }
    });

    socket.on("offer", async ({ offer, fromId }: { offer: RTCSessionDescriptionInit; fromId: string }) => {
      let pc = peerConnectionsRef.current.get(fromId);
      
      if (!pc) {
        pc = makePeerConnection(fromId, socket);

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => {
            pc!.addTrack(track, localStreamRef.current!);
          });
        } else {
          pc.addTransceiver('video', { direction: 'recvonly' });
          pc.addTransceiver('audio', { direction: 'recvonly' });
        }
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
      const timer = iceRestartTimersRef.current.get(userId);
      if (timer) {
        clearTimeout(timer);
        iceRestartTimersRef.current.delete(userId);
      }
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
      iceRestartTimersRef.current.forEach((timer) => clearTimeout(timer));
      iceRestartTimersRef.current.clear();
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
    };
  }, [roomId, makePeerConnection]);

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

  const publishLocalStream = async (stream: MediaStream) => {
    localStreamRef.current = stream;

    for (const [userId, pc] of peerConnectionsRef.current.entries()) {
      pc.getSenders().forEach((sender) => {
        if (sender.track) {
          pc.removeTrack(sender);
        }
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("offer", { targetId: userId, offer });
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

  const startRtmp = (rtmpUrl: string) => {
    if (socketRef.current) {
      setRtmpStatus("connecting");
      setRtmpError(null);
      socketRef.current.emit("start-rtmp", { rtmpUrl });
    }
  };

  const stopRtmp = () => {
    if (socketRef.current) {
      socketRef.current.emit("stop-rtmp");
    }
    setRtmpStatus("idle");
  };

  const sendRtmpChunk = (chunk: Blob) => {
    if (socketRef.current) {
      socketRef.current.emit("stream-chunk", chunk);
    }
  };

  return {
    localStreamRef,
    remoteStreams,
    isConnected,
    connectionError,
    rtmpStatus,
    rtmpError,
    startLocalStream,
    stopLocalStream,
    publishLocalStream,
    toggleVideo,
    toggleAudio,
    startRtmp,
    stopRtmp,
    sendRtmpChunk,
  };
};
