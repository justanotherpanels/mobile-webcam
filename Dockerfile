FROM node:20-alpine

# Install FFmpeg for RTMP Streaming support
RUN apk update && \
    apk add --no-cache ffmpeg

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY server.js ./

EXPOSE 8080
CMD ["node", "server.js"]
