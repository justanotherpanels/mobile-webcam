"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Users } from 'lucide-react';

export default function OBSView() {
  const params = useParams();
  const roomId = params.roomId as string;
  
  const { remoteStreams, isConnected } = useWebRTC({ roomId });

  const [hasStarted, setHasStarted] = useState(false);

  // In OBS, we might need a user interaction to play audio, but we can try to autoplay
  useEffect(() => {
    // Auto-join without camera
    setHasStarted(true);
  }, []);

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white">Starting viewer...</div>
      </div>
    );
  }

  const remoteEntries = Array.from(remoteStreams.entries());

  return (
    <>
      <style>
        {`
          body { background-color: transparent !important; margin: 0; overflow: hidden; }
        `}
      </style>

      {/* Kontainer Utama - Transparan untuk OBS */}
      <div className="relative w-full h-[100dvh] bg-transparent overflow-hidden flex flex-col text-white">
        
        {/* Pesan saat kosong */}
        {remoteEntries.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/40 backdrop-blur-sm">
            <Users size={48} className="mb-4 opacity-50" />
            <p>Menunggu kamera (Room: {roomId})</p>
            <p className="text-xs mt-2 text-gray-600">{isConnected ? "Terhubung ke server" : "Menghubungkan..."}</p>
          </div>
        )}

        {/* Video Grid untuk OBS */}
        <div className="relative w-full h-full flex items-center justify-center bg-transparent">
          <div className={`w-full h-full grid ${
            remoteEntries.length === 0 ? 'hidden' : 
            remoteEntries.length === 1 ? 'grid-cols-1' : 
            remoteEntries.length <= 4 ? 'grid-cols-2' : 
            'grid-cols-3'
          }`}>
            {remoteEntries.map(([userId, userStream]) => (
              <div key={userId} className="relative w-full h-full">
                <video 
                  autoPlay 
                  playsInline
                  className="w-full h-full object-cover"
                  ref={(el) => {
                    if (el) el.srcObject = userStream;
                  }}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
