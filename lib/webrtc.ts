export const iceServers = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
  {
    urls: "stun:stun1.l.google.com:19302",
  },
  {
    urls: "turn:numb.viagenie.ca",
    username: "webrtc@live.com",
    credential: "muazkh",
  },
];

export const createPeerConnection = (
  onIceCandidate: (candidate: RTCIceCandidate | null) => void,
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers });

  pc.onicecandidate = (event) => {
    onIceCandidate(event.candidate);
  };

  pc.ontrack = (event) => {
    onTrack(event);
  };

  return pc;
};
