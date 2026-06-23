export type RtmpRecorderOptions = {
  mimeType: string;
  supported: boolean;
};

export const getRtmpRecorderOptions = (): RtmpRecorderOptions => {
  if (typeof MediaRecorder === "undefined") {
    return { mimeType: "", supported: false };
  }

  const candidates = [
    "video/webm;codecs=h264",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  for (const mimeType of candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return { mimeType, supported: true };
    }
  }

  return { mimeType: "", supported: false };
};
