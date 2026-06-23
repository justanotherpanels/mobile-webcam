"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff,
  PhoneMissed,
  MoreVertical,
  SwitchCamera,
  Copy,
  Users,
  Share2,
  Radio
} from 'lucide-react';

export default function Home() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  
  const {
    localStreamRef,
    remoteStreams,
    startLocalStream,
    stopLocalStream,
    toggleVideo: toggleVideoWebRTC,
    toggleAudio: toggleAudioWebRTC,
    startRtmp,
    stopRtmp,
    sendRtmpChunk,
  } = useWebRTC({ roomId: roomId || '' });

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [showRtmpModal, setShowRtmpModal] = useState(false);
  const [rtmpUrl, setRtmpUrl] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const existing = new URLSearchParams(window.location.search).get('room');
    const newRoomId = existing || Math.random().toString(36).substring(2, 10);
    setRoomId(newRoomId);
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

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
      localStreamRef.current = mediaStream;
      setErrorMsg('');
      setJoined(true);
    } catch (err) {
      console.error("Gagal mengakses kamera/mic:", err);
      setErrorMsg('Gagal mengakses perangkat. Pastikan izin kamera dan mikrofon diberikan.');
    }
  };

  const leaveRoom = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    stopLocalStream();
    setJoined(false);
    setStream(null);
  };

  // Fungsi Toggle Mikrofon
  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = isAudioMuted; // Jika sedang mute, enable (true)
      });
      setIsAudioMuted(!isAudioMuted);
    }
    toggleAudioWebRTC();
  };

  // Fungsi Toggle Kamera
  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff; // Jika sedang off, enable (true)
      });
      setIsVideoOff(!isVideoOff);
    }
    toggleVideoWebRTC();
  };

  // Fungsi mengganti kamera depan/belakang
  const switchCamera = () => {
    setFacingMode(prevMode => prevMode === 'environment' ? 'user' : 'environment');
    if (stream) {
      startCamera(facingMode === 'environment' ? 'user' : 'environment');
    }
  };

  const copyRoomLink = () => {
    if (roomId) {
      const link = `${window.location.origin}?room=${roomId}`;
      navigator.clipboard.writeText(link);
      setCopied('Room link copied!');
    }
  };

  const copyCameraLink = () => {
    if (roomId) {
      const link = `${window.location.origin}/camera/${roomId}`;
      navigator.clipboard.writeText(link);
      setCopied('Camera link copied!');
    }
  };

  const copyOBSLink = () => {
    if (roomId) {
      const link = `${window.location.origin}/view/${roomId}`;
      navigator.clipboard.writeText(link);
      setCopied('OBS View link copied!');
    }
  };

  const handleStartStreaming = () => {
    if (!rtmpUrl) return alert("RTMP URL is required");
    if (!stream) return alert("Camera not started");
    
    startRtmp(rtmpUrl);
    
    // Try h264 first for better FFmpeg compatibility, fallback to vp8/default
    let options = { mimeType: 'video/webm;codecs=h264' };
    if (!MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
      options = { mimeType: 'video/webm;codecs=vp8' };
    }
    
    const mediaRecorder = new MediaRecorder(stream, options);
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        sendRtmpChunk(event.data);
      }
    };
    
    mediaRecorder.start(1000); // Send chunk every second
    mediaRecorderRef.current = mediaRecorder;
    setIsStreaming(true);
    setShowRtmpModal(false);
  };

  const handleStopStreaming = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    stopRtmp();
    setIsStreaming(false);
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
      <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-8 overflow-hidden font-sans">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[128px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] mix-blend-screen pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-md">
          {/* Glass Card */}
          <div className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl p-8 sm:p-10 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]">
            
            {/* Header Section */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 mb-6 shadow-lg shadow-purple-500/30">
                <Video size={32} className="text-white" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-3 tracking-tight">
                WebCam Mobile
              </h1>
              <p className="text-sm sm:text-base text-gray-400 font-medium">
                Camera for IRL stream Access
              </p>
            </div>
            
            {/* Room ID Section */}
            <div className="mb-8">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 ml-1">
                Share Room ID
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={roomId}
                  readOnly
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white font-mono text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={copyRoomLink}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white transition-all cursor-pointer group-hover:bg-purple-500/20 group-hover:text-purple-300"
                  title="Copy room link"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => startCamera(facingMode)}
              className="group relative w-full bg-white text-black font-semibold py-4 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Users size={20} className="relative z-10" />
              <span className="relative z-10 text-lg">Join Room Now</span>
            </button>
          </div>
          
          {/* Footer branding */}
          <div className="mt-8 text-center text-xs text-gray-600 font-medium">
            Secured by WebRTC & Socket.io
          </div>
        </div>

        {copied && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 text-white px-6 py-3 rounded-full z-50 animate-in slide-in-from-top-4 fade-in duration-300 shadow-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium">{copied}</span>
          </div>
        )}
      </div>
    );
  }

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
              className="mt-3 px-4 py-2 bg-white text-black rounded-full font-medium text-xs cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full px-4 py-5 sm:py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="w-full sm:w-auto flex justify-between items-center bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <Share2 size={14} className="text-purple-400" />
              <span className="text-xs sm:text-sm font-medium tracking-wide text-white/90">Room: {roomId}</span>
            </div>
            {/* Camera switch on mobile */}
            <button 
              onClick={switchCamera}
              className="sm:hidden p-1.5 bg-white/10 rounded-full active:scale-95 transition-transform cursor-pointer ml-4"
            >
              <SwitchCamera size={16} className="text-white" />
            </button>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <button
              onClick={copyRoomLink}
              className="flex-1 sm:flex-none bg-black/60 backdrop-blur-md py-2 sm:px-4 sm:py-2 rounded-xl text-white hover:bg-black/80 transition cursor-pointer border border-white/10 flex justify-center"
              title="Copy Room Link"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Share2 size={14} />
                <span className="hidden xl:inline">Room Link</span>
                <span className="xl:hidden">Room</span>
              </div>
            </button>
            <button
              onClick={copyCameraLink}
              className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 py-2 sm:px-4 sm:py-2 rounded-xl text-white transition cursor-pointer border border-purple-500/50 flex justify-center"
              title="Copy Camera Link"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Copy size={14} />
                <span className="hidden xl:inline">Camera Link</span>
                <span className="xl:hidden">Camera</span>
              </div>
            </button>
            <button
              onClick={copyOBSLink}
              className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 py-2 sm:px-4 sm:py-2 rounded-xl text-white transition cursor-pointer border border-indigo-500/50 flex justify-center"
              title="Copy OBS Link"
            >
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Copy size={14} />
                <span className="hidden xl:inline">OBS Link</span>
                <span className="xl:hidden">OBS</span>
              </div>
            </button>
            <button 
              onClick={switchCamera}
              className="hidden sm:block p-2.5 bg-zinc-800/60 rounded-full backdrop-blur-md active:scale-95 transition-transform cursor-pointer border border-white/10"
            >
              <SwitchCamera size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="relative w-full h-full bg-[#111] flex flex-col justify-center overflow-hidden">
          {(() => {
            const remoteEntries = Array.from(remoteStreams.entries());
            const participantCount = remoteEntries.length + (stream ? 1 : 0);

            // 1 Participant (Hanya Local)
            if (participantCount <= 1) {
              return (
                <div className="relative w-full h-full">
                  {stream ? (
                    <>
                      <video 
                        autoPlay 
                        playsInline 
                        muted
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        ref={(el) => { if (el) el.srcObject = stream; }}
                      />
                      <div className="absolute bottom-32 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center space-x-2 border border-white/10 z-10 shadow-lg">
                        {isAudioMuted && <MicOff size={14} className="text-red-400" />}
                        <span className="text-xs font-medium tracking-wide text-white">Anda</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      Menunggu kamera...
                    </div>
                  )}
                </div>
              );
            }

            // 2 Participants (PiP Layout - Zoom/GMeet style)
            if (participantCount === 2) {
              const [remoteId, remoteStream] = remoteEntries[0];
              return (
                <div className="relative w-full h-full">
                  {/* Remote Stream (Main Background) */}
                  <video 
                    autoPlay 
                    playsInline
                    className="w-full h-full object-cover"
                    ref={(el) => { if (el) el.srcObject = remoteStream; }}
                  />
                  <div className="absolute bottom-32 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center space-x-2 border border-white/10 z-10 shadow-lg">
                    <span className="text-xs font-medium tracking-wide text-white">User {remoteId.substring(0, 4)}</span>
                  </div>

                  {/* Local Stream (PiP) */}
                  {stream && (
                    <div className="absolute bottom-32 right-4 w-28 h-40 sm:w-48 sm:h-32 bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20 cursor-move">
                      <video 
                        autoPlay 
                        playsInline 
                        muted
                        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                        ref={(el) => { if (el) el.srcObject = stream; }}
                      />
                      {isAudioMuted && (
                        <div className="absolute bottom-2 right-2 bg-black/60 p-1.5 rounded-md backdrop-blur-md border border-white/10">
                          <MicOff size={12} className="text-red-400" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            // 3+ Participants (Grid Layout)
            return (
              <div className="w-full h-full p-2 sm:p-4 pb-32 sm:pb-32 pt-28 sm:pt-28 grid gap-2 sm:gap-4" style={{
                gridTemplateColumns: participantCount > 4 ? 'repeat(auto-fit, minmax(150px, 1fr))' : 'repeat(2, 1fr)',
                gridTemplateRows: participantCount > 2 && participantCount <= 4 ? 'repeat(2, 1fr)' : 'auto'
              }}>
                {/* Local Stream Grid Item */}
                {stream && (
                  <div className="relative bg-zinc-900 rounded-2xl overflow-hidden shadow-lg w-full h-full border border-white/5">
                    <video 
                      autoPlay 
                      playsInline 
                      muted
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                      ref={(el) => { if (el) el.srcObject = stream; }}
                    />
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center space-x-2 border border-white/10 shadow-lg">
                      {isAudioMuted && <MicOff size={14} className="text-red-400" />}
                      <span className="text-xs font-medium tracking-wide text-white">Anda</span>
                    </div>
                  </div>
                )}
                
                {/* Remote Streams Grid Items */}
                {remoteEntries.map(([userId, userStream]) => (
                  <div key={userId} className="relative bg-zinc-900 rounded-2xl overflow-hidden shadow-lg w-full h-full border border-white/5">
                    <video 
                      autoPlay 
                      playsInline
                      className="w-full h-full object-cover"
                      ref={(el) => { if (el) el.srcObject = userStream; }}
                    />
                    <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center space-x-2 border border-white/10 shadow-lg">
                      <span className="text-xs font-medium tracking-wide text-white">User {userId.substring(0, 4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Bottom Controls (Dock Menu) */}
        <div className="absolute bottom-0 left-0 w-full px-4 pb-6 sm:pb-8 pt-8 z-20 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex justify-between items-center bg-zinc-800/80 backdrop-blur-2xl px-5 sm:px-6 py-3.5 sm:py-4 rounded-[2rem] shadow-2xl border border-white/10 max-w-md mx-auto">
            
            {/* Tombol End Call (Merah) */}
            <button 
              onClick={leaveRoom}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
            >
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
            
            {/* Tombol RTMP Stream */}
            <button 
              onClick={() => isStreaming ? handleStopStreaming() : setShowRtmpModal(true)}
              className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${isStreaming ? 'bg-red-500 animate-pulse text-white' : 'bg-white/15 text-white hover:bg-white/20'}`}
              title="Broadcast RTMP"
            >
              <Radio size={22} />
            </button>

            {/* Tombol Menu Lainnya */}
            <button className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center active:scale-95 transition-transform text-white hover:bg-white/20 cursor-pointer">
              <MoreVertical size={22} />
            </button>

          </div>
        </div>

        {copied && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg z-50 animate-pulse">
            {copied}
          </div>
        )}

        {/* RTMP Modal */}
        {showRtmpModal && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Radio className="text-red-500" />
                Broadcast to RTMP
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Stream your camera directly to YouTube, Twitch, atau custom RTMP server.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">RTMP URL (dengan Stream Key)</label>
                  <input
                    type="text"
                    value={rtmpUrl}
                    onChange={(e) => setRtmpUrl(e.target.value)}
                    placeholder="rtmp://a.rtmp.youtube.com/live2/xxxx-xxxx"
                    className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => setShowRtmpModal(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleStartStreaming}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Radio size={16} /> Go Live
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
