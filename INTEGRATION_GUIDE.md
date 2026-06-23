# Panduan Integrasi dengan OBS, TikTok Studio, dan Streamlabs

## Cara Menggunakan StreamCam sebagai Virtual Webcam

### 1. Siapkan Aplikasi
- Pastikan server signaling berjalan: `npm run server` (port default `8080`)
- Pastikan Next.js app berjalan: `npm run dev`
- Set `NEXT_PUBLIC_SOCKET_URL=http://localhost:8080` di `.env.local` untuk dev lokal

### 2. Buat Room Kamera
1. Buka `http://localhost:3000`
2. Klik **"Join Room"**
3. Copy dua link berbeda:
   - **Camera Link** (`/camera/{roomId}`) — buka di **HP** untuk publish kamera
   - **OBS Link** (`/view/{roomId}?clean=1`) — buka di **OBS Browser Source** di laptop

---

## Integrasi dengan OBS Studio

### Alur yang Benar
1. **HP**: Buka Camera Link → izinkan kamera & mikrofon → kamera mulai streaming
2. **Laptop/OBS**: Tambahkan Browser Source dengan OBS View Link

> **Penting:** Jangan paste Camera Link ke OBS. Camera Link adalah halaman publisher (HP). OBS membutuhkan View Link (receive-only, background transparan).

### Langkah-langkah OBS:
1. Buka OBS Studio
2. Di bagian **Sources**, klik **+** → Pilih **Browser**
3. Beri nama source (misal: "StreamCam View")
4. Di **URL**, paste **OBS View Link** (format: `http://localhost:3000/view/{roomId}?clean=1`)
5. Atur **Width**: `1920` dan **Height**: `1080`
6. Centang **"Refresh browser when scene becomes active"**
7. **Matikan** "Shutdown source when not visible" (agar koneksi tetap hidup)
8. Klik **OK**
9. Video dari HP akan muncul di OBS setelah kamera terhubung

### Query Parameters OBS View
| Param | Contoh | Fungsi |
|-------|--------|--------|
| `clean=1` | `?clean=1` | Sembunyikan overlay "menunggu kamera" — background fully transparent |
| `fit=contain` | `?fit=contain` | Video tidak ter-crop (letterbox jika perlu) |
| `fit=cover` | `?fit=cover` | Video fill penuh (default, crop jika perlu) |

Contoh URL lengkap: `https://yourdomain.com/view/abc123?clean=1&fit=contain`

---

## Integrasi dengan TikTok Studio

### Langkah-langkah:
1. Buka TikTok Studio → **Go Live**
2. Di **Sources**, klik **+** → Pilih **Browser**
3. Paste **OBS View Link** (`/view/{roomId}?clean=1`) ke **URL**
4. Atur ukuran 1920×1080
5. Klik **Add**
6. Buka Camera Link di HP terlebih dahulu

---

## Integrasi dengan Streamlabs OBS

### Langkah-langkah:
1. Buka Streamlabs OBS
2. Di **Sources**, klik **+** → Pilih **Browser Source**
3. Paste **OBS View Link** (`/view/{roomId}?clean=1`)
4. Atur resolusi 1920×1080
5. Centang refresh saat scene aktif
6. Klik **Done**

---

## RTMP Streaming (YouTube / Twitch)

Alternatif selain OBS Browser Source — stream langsung ke platform RTMP:

1. Buka halaman utama di HP/laptop dengan kamera aktif
2. Klik tombol **Radio** (RTMP) di control bar
3. Paste RTMP URL lengkap dengan stream key
4. Klik **Go Live**

> **Catatan:** RTMP via browser tidak didukung di Safari/iOS. Gunakan Chrome/Android untuk fitur ini.

---

## Tips Tambahan

1. **OBS Virtual Camera**:
   - Setelah Browser Source aktif, klik **Start Virtual Camera** di OBS
   - Pilih "OBS Virtual Camera" di Zoom, Teams, dll.

2. **Kualitas Video**:
   - Resolusi Browser Source OBS sebaiknya match resolusi kamera (720p atau 1080p)

3. **HP Bergerak / Ganti WiFi**:
   - Koneksi WebRTC akan auto-reconnect via ICE restart
   - Jika video putus, refresh Browser Source di OBS

4. **Halaman Camera vs View**:
   - `/camera/{roomId}` — publisher (HP), UI kontrol kamera
   - `/view/{roomId}` — viewer (OBS), transparan, tanpa UI
