FROM node:20-alpine

# Install FFmpeg for RTMP Streaming support
RUN apk update && \
    apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY server.js ./

CMD ["node", "server.js"]
