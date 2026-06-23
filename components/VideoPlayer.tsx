import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream;
  isLocal?: boolean;
  name?: string;
}

export const VideoPlayer = ({ stream, isLocal = false, name }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className="w-full h-full object-cover"
      />
      {name && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {name}
        </div>
      )}
    </div>
  );
};
