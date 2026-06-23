# RTMP Streaming Setup

To add RTMP streaming support with FFmpeg, follow these steps:

## 1. Install FFmpeg
Download and install FFmpeg from [ffmpeg.org](https://ffmpeg.org/)

## 2. Set up an RTMP Server
You can use:
- Nginx with RTMP Module
- MediaSoup
- Ant Media Server
- Or use a cloud service like AWS IVS, Mux, etc.

### Example Nginx RTMP Config:
```nginx
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;
        }
    }
}
```

## 3. Stream with FFmpeg
Use this command to stream your webcam to RTMP:

```bash
ffmpeg -f dshow -i video="USB Camera":audio="Microphone" -vcodec libx264 -preset veryfast -maxrate 3000k -bufsize 6000k -pix_fmt yuv420p -g 50 -c:a aac -b:a 160k -ar 44100 -f flv rtmp://your-server/live/stream-key
```

## 4. Playback in Browser
You can use video.js or hls.js to play the RTMP stream (or HLS/DASH converted stream) in the browser.
