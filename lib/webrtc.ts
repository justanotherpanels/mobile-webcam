export const getIceServers = (): RTCIceServer[] => {
  const customIceServersStr = process.env.NEXT_PUBLIC_ICE_SERVERS;
  
  if (customIceServersStr) {
    try {
      // Allow passing a JSON array of ICE servers via env
      return JSON.parse(customIceServersStr);
    } catch (e) {
      console.error("Failed to parse NEXT_PUBLIC_ICE_SERVERS, falling back to defaults", e);
    }
  }

  // Default fallback (Google STUN) if no env var is provided
  return [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    }
  ];
};

export const createPeerConnection = (
  onIceCandidate: (candidate: RTCIceCandidate | null) => void,
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers: getIceServers() });

  pc.onicecandidate = (event) => {
    onIceCandidate(event.candidate);
  };

  pc.ontrack = (event) => {
    onTrack(event);
  };

  return pc;
};
