import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  stream: MediaStream;
  isLocal?: boolean;
  name?: string;
  className?: string;
  containerClassName?: string;
  mirrored?: boolean;
}

export const VideoPlayer = ({
  stream,
  isLocal = false,
  name,
  className = "w-full h-full object-cover",
  containerClassName = "relative bg-black rounded-lg overflow-hidden aspect-video",
  mirrored = false,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className={containerClassName}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`${className}${mirrored ? " scale-x-[-1]" : ""}`}
      />
      {name && (
        <div className="absolute bottom-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {name}
        </div>
      )}
    </div>
  );
};
