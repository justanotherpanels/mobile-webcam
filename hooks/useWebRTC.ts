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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (window.location.hostname === "localhost"
        ? "http://localhost:3001"
        : "https://mobile-webcam-production.up.railway.app");
    
    // Always start with polling, then upgrade to WebSocket. 
    // Railway proxy drops direct WebSocket handshakes without HTTP first.
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

    socket.on("user-joined", async (userId: string) => {
      // Prevent glare by deciding who initiates the offer
      const isInitiator = (socket.id || "") > userId;

      let pc = peerConnectionsRef.current.get(userId);
      if (!pc) {
        pc = createPeerConnection(
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
        pc = createPeerConnection(
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
      peerConnections.forEach((pc) => pc.close());
      peerConnections.clear();
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
      socketRef.current.emit("start-rtmp", { rtmpUrl });
    }
  };

  const stopRtmp = () => {
    if (socketRef.current) {
      socketRef.current.emit("stop-rtmp");
    }
  };

  const sendRtmpChunk = (chunk: Blob) => {
    if (socketRef.current) {
      socketRef.current.emit("stream-chunk", chunk);
    }
  };

  // Listen for RTMP events from server
  useEffect(() => {
    if (!socketRef.current) return;
    
    const handleRtmpError = (err: string) => {
      console.error("RTMP Error:", err);
      alert(`RTMP Streaming Error: ${err}`);
    };

    socketRef.current.on("rtmp-error", handleRtmpError);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("rtmp-error", handleRtmpError);
      }
    };
  }, [isConnected]);

  return {
    localStreamRef,
    remoteStreams,
    isConnected,
    connectionError,
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
