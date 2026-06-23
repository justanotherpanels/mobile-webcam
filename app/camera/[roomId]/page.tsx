"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneMissed,
  MoreVertical,
  SwitchCamera
} from 'lucide-react';

export default function App() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { publishLocalStream, stopLocalStream, connectionError } = useWebRTC({ roomId });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user'); // Default ke kamera depan untuk meeting
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Inisialisasi Kamera & Audio
  const startCamera = async (mode: 'user' | 'environment') => {
    // Hentikan stream yang sedang berjalan (jika ada)
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
        audio: true // Mengaktifkan mikrofon
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      await publishLocalStream(mediaStream);
      setErrorMsg('');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      return mediaStream;
    } catch (err) {
      console.error("Gagal mengakses kamera/mic:", err);
      setErrorMsg('Gagal mengakses perangkat. Pastikan izin kamera dan mikrofon diberikan.');
      return null;
    }
  };

  // Jalankan saat komponen dimuat atau facingMode berubah
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
    
    // Cleanup saat komponen dibongkar
    return () => {
      active = false;
      activeStream?.getTracks().forEach(track => track.stop());
      stopLocalStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Fungsi Toggle Mikrofon
  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted; // Jika sedang mute, enable (true)
      });
      setIsAudioMuted(!isAudioMuted);
    }
  };

  // Fungsi Toggle Kamera
  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff; // Jika sedang off, enable (true)
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Fungsi mengganti kamera depan/belakang
  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
  };

  return (
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');
          body { font-family: 'Poppins', sans-serif; background-color: #111111; margin: 0; }
        `}
      </style>

      {/* Kontainer Utama - Ukuran Layar Penuh */}
      <div className="relative w-full h-[100dvh] bg-[#111] overflow-hidden flex flex-col text-white">
        
        {/* Pesan Error */}
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

        {/* Top Bar (Header Info) */}
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

        {/* Video Feed */}
        <div className="relative w-full h-full bg-[#111] flex items-center justify-center">
          {isVideoOff ? (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-semibold shadow-2xl border-4 border-indigo-400/30">
              C
            </div>
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted // Lokal video selalu di-mute agar suara Anda tidak bergema balik
              className={`w-full h-full object-cover transition-opacity duration-300 ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}
          
          {/* Label Nama Peserta & Indikator Mute */}
          <div className="absolute bottom-28 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center space-x-2 z-10 border border-white/10 shadow-lg">
            {isAudioMuted && <MicOff size={14} className="text-red-400" />}
            <span className="text-xs font-medium tracking-wide">Camera ({roomId})</span>
          </div>
        </div>

        {/* Bottom Controls (Dock Menu) */}
        <div className="absolute bottom-0 left-0 w-full px-4 pb-6 sm:pb-8 pt-8 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex justify-between items-center bg-zinc-800/80 backdrop-blur-2xl px-5 sm:px-6 py-3.5 sm:py-4 rounded-[2rem] shadow-2xl border border-white/10 max-w-md mx-auto">
            
            {/* Tombol End Call (Merah) */}
            <button className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer">
              <PhoneMissed size={24} className="text-white" />
            </button>

            {/* Tombol Kamera */}
            <button 
              onClick={toggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${isVideoOff ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/20'}`}
            >
              {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            </button>

            {/* Tombol Mikrofon */}
            <button 
              onClick={toggleAudio}
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${isAudioMuted ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/20'}`}
            >
              {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            {/* Tombol Menu Lainnya */}
            <button className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center active:scale-95 transition-transform text-white hover:bg-white/20 cursor-pointer">
              <MoreVertical size={22} />
            </button>

          </div>
        </div>

      </div>
    </>
  );
}
