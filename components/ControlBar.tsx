import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Share2,
  MessageSquare,
  Settings,
} from "lucide-react";

interface ControlBarProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onLeave: () => void;
}

export const ControlBar = ({
  isVideoEnabled,
  isAudioEnabled,
  onToggleVideo,
  onToggleAudio,
  onLeave,
}: ControlBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 z-40">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onToggleAudio}
          className={`p-4 rounded-full transition-all ${
            isAudioEnabled
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`p-4 rounded-full transition-all ${
            isVideoEnabled
              ? "bg-white/10 hover:bg-white/20 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
        >
          {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
          <Share2 size={24} />
        </button>

        <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
          <MessageSquare size={24} />
        </button>

        <button className="p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all">
          <Settings size={24} />
        </button>

        <button
          onClick={onLeave}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};
