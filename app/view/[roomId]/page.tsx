"use client";

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Users } from 'lucide-react';

function OBSViewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const roomId = params.roomId as string;

  const clean = searchParams.get('clean') === '1' || searchParams.get('scene') === '0';
  const fitParam = searchParams.get('fit');
  const objectFit = fitParam === 'contain' ? 'object-contain' : 'object-cover';
  
  const { remoteStreams, isConnected, connectionError } = useWebRTC({ roomId });

  const remoteEntries = Array.from(remoteStreams.entries());
  const showWaitingOverlay = remoteEntries.length === 0 && !clean;

  return (
    <>
      <style>
        {`
          body { background-color: transparent !important; margin: 0; overflow: hidden; }
        `}
      </style>

      <div className="relative w-full h-[100dvh] bg-transparent overflow-hidden flex flex-col text-white">
        
        {showWaitingOverlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-black/40 backdrop-blur-sm">
            <Users size={48} className="mb-4 opacity-50" />
            <p>Menunggu kamera (Room: {roomId})</p>
            <p className="text-xs mt-2 text-gray-600">
              {connectionError ? `Gagal terhubung: ${connectionError}` : isConnected ? "Terhubung ke server" : "Menghubungkan..."}
            </p>
          </div>
        )}

        <div className="relative w-full h-full flex items-center justify-center bg-transparent">
          <div className={`w-full h-full ${
            remoteEntries.length === 0 ? 'hidden' :
            remoteEntries.length === 1 ? 'flex items-center justify-center' :
            `grid ${remoteEntries.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`
          }`}>
            {remoteEntries.map(([userId, userStream]) => (
              <div key={userId} className="relative w-full h-full">
                <video 
                  autoPlay 
                  playsInline
                  className={`w-full h-full ${objectFit}`}
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

export default function OBSView() {
  return (
    <Suspense fallback={<div className="w-full h-[100dvh] bg-transparent" />}>
      <OBSViewContent />
    </Suspense>
  );
}
