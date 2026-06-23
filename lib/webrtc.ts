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

  // Default fallback (Google STUN + Metered OpenRelay Free TURN) 
  // This ensures connectivity even behind strict NAT firewalls
  return [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "stun:stun1.l.google.com:19302",
    },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject",
    }
  ];
};

export const createPeerConnection = (
  onIceCandidate: (candidate: RTCIceCandidate | null) => void,
  onTrack: (event: RTCTrackEvent) => void,
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers: getIceServers() });

  pc.onicecandidate = (event) => {
    onIceCandidate(event.candidate);
  };

  pc.ontrack = (event) => {
    onTrack(event);
  };

  pc.oniceconnectionstatechange = () => {
    onIceConnectionStateChange?.(pc.iceConnectionState);
  };

  return pc;
};
