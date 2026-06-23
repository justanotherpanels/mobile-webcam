"use client";

import { useState, useEffect } from "react";
import { VideoPlayer } from "@/components/VideoPlayer";
import { ControlBar } from "@/components/ControlBar";
import { useWebRTC } from "@/hooks/useWebRTC";
import { Copy, Users, Share2 } from "lucide-react";

export default function Home() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const existing = new URLSearchParams(window.location.search).get("room");
    const newRoomId = existing || Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const {
    localStreamRef,
    remoteStreams,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
  } = useWebRTC({ roomId: roomId || "" });

  const joinRoom = async () => {
    const stream = await startLocalStream();
    if (stream) {
      setLocalStream(stream);
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    stopLocalStream();
    setJoined(false);
    setLocalStream(null);
  };

  const handleToggleVideo = () => {
    toggleVideo();
    setIsVideoEnabled((prev) => !prev);
  };

  const handleToggleAudio = () => {
    toggleAudio();
    setIsAudioEnabled((prev) => !prev);
  };

  const copyRoomLink = () => {
    if (roomId) {
      const link = `${window.location.origin}?room=${roomId}`;
      navigator.clipboard.writeText(link);
      setCopied("Room link copied!");
    }
  };

  const copyCameraLink = () => {
    if (roomId) {
      const link = `${window.location.origin}/camera/${roomId}`;
      navigator.clipboard.writeText(link);
      setCopied("Camera link copied!");
    }
  };

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">VDO.Ninja</h1>
            <p className="text-gray-300">Peer-to-peer video conferencing</p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={roomId}
                readOnly
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white"
              />
              <button
                onClick={copyRoomLink}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors cursor-pointer"
                title="Copy room link"
              >
                <Copy size={20} />
              </button>
            </div>
          </div>

          <button
            onClick={joinRoom}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users size={20} />
            Join Room
          </button>
        </div>

        {copied && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50 animate-pulse">
            {copied}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localStream && (
            <VideoPlayer stream={localStream} isLocal name="You" />
          )}
          {Array.from(remoteStreams.entries()).map(([userId, stream]) => (
            <VideoPlayer
              key={userId}
              stream={stream}
              name={`User ${userId.substring(0, 4)}`}
            />
          ))}
        </div>
      </div>

      <ControlBar
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        onToggleVideo={handleToggleVideo}
        onToggleAudio={handleToggleAudio}
        onLeave={leaveRoom}
      />

      <div className="fixed top-4 left-4 right-4 flex justify-between items-start z-50">
        <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-lg text-white">
          <div className="flex items-center gap-2">
            <Share2 size={16} />
            <span>Room: {roomId}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={copyRoomLink}
            className="bg-black/70 backdrop-blur px-4 py-2 rounded-lg text-white hover:bg-black/80 transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Share2 size={16} />
              <span>Copy Room Link</span>
            </div>
          </button>
          <button
            onClick={copyCameraLink}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Camera Link</span>
            </div>
          </button>
        </div>
      </div>

      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50 animate-pulse">
          {copied}
        </div>
      )}
    </div>
  );
}
