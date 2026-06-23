"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoPlayer } from '@/components/VideoPlayer';
import { ControlBar } from '@/components/ControlBar';
import { SwitchCamera } from 'lucide-react';

export default function CameraPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { publishLocalStream, stopLocalStream, connectionError } = useWebRTC({ roomId });
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const startCamera = async (mode: 'user' | 'environment') => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      await publishLocalStream(mediaStream);
      setErrorMsg('');
      return mediaStream;
    } catch (err) {
      console.error("Gagal mengakses kamera/mic:", err);
      setErrorMsg('Gagal mengakses perangkat. Pastikan izin kamera dan mikrofon diberikan.');
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    let activeStream: MediaStream | null = null;

    const openCamera = async () => {
      const mediaStream = await startCamera(facingMode);
      if (!active) {
        mediaStream?.getTracks().forEach(track => track.stop());
        return;
      }
      activeStream = mediaStream;
    };

    openCamera();
    
    return () => {
      active = false;
      activeStream?.getTracks().forEach(track => track.stop());
      stopLocalStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted;
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

  const handleLeave = () => {
    stream?.getTracks().forEach(track => track.stop());
    stopLocalStream();
    setStream(null);
    window.history.back();
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
          body { font-family: 'Poppins', sans-serif; background-color: #111111; margin: 0; }
        `}
      </style>

      <div className="relative w-full h-[100dvh] bg-[#111] overflow-hidden flex flex-col text-white">
        
        {errorMsg && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 text-center p-4 text-sm text-red-400 bg-black/90 rounded-xl max-w-[90%] border border-red-500/30">
            <p>{errorMsg}</p>
            <button 
              onClick={() => startCamera(facingMode)}
              className="mt-3 px-4 py-2 bg-white text-black rounded-full font-medium text-xs"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {connectionError && (
          <div className="absolute top-44 left-1/2 -translate-x-1/2 z-50 text-center p-4 text-sm text-amber-300 bg-black/90 rounded-xl max-w-[90%] border border-amber-500/30">
            <p>Gagal terhubung ke server: {connectionError}</p>
          </div>
        )}

        <div className="absolute top-0 left-0 w-full px-4 py-5 sm:py-8 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">Camera Mode</span>
          </div>
          <button 
            onClick={switchCamera}
            className="p-2.5 bg-black/50 border border-white/10 rounded-full backdrop-blur-md active:scale-95 transition-transform cursor-pointer hover:bg-black/70"
          >
            <SwitchCamera size={20} className="text-white" />
          </button>
        </div>

        <div className="relative w-full h-full bg-[#111] flex items-center justify-center">
          {isVideoOff || !stream ? (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-semibold shadow-2xl border-4 border-indigo-400/30">
              C
            </div>
          ) : (
            <VideoPlayer
              stream={stream}
              isLocal
              name={`Camera (${roomId})`}
              mirrored={facingMode === 'user'}
              containerClassName="relative w-full h-full"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <ControlBar
          isVideoEnabled={!isVideoOff}
          isAudioEnabled={!isAudioMuted}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
          onLeave={handleLeave}
        />
      </div>
    </>
  );
}
