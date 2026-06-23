# Panduan Integrasi dengan OBS, TikTok Studio, dan Streamlabs

## Cara Menggunakan VDO.Ninja sebagai Virtual Webcam

### 1. Siapkan Aplikasi
- Pastikan server signaling berjalan: `node server.js`
- Pastikan Next.js app berjalan: `npm run dev`

### 2. Buat Room Kamera
1. Buka `http://localhost:3000`
2. Klik **"Join Room"**
3. Klik **"Copy Camera Link"** (link format: `http://localhost:3000/camera/{roomId}`)

---

## Integrasi dengan OBS Studio

### Langkah-langkah:
1. Buka OBS Studio
2. Di bagian **Sources**, klik **+** → Pilih **Browser**
3. Beri nama source (misal: "VDO.Ninja Camera")
4. Di **URL**, paste link camera yang dicopy
5. Atur **Width** dan **Height** sesuai kebutuhan (misal: 1920x1080)
6. Centang **"Refresh browser when scene becomes active"**
7. Klik **OK**
8. Done! Sekarang kamu bisa melihat video kamu di OBS

---

## Integrasi dengan TikTok Studio

### Langkah-langkah:
1. Buka TikTok Studio
2. Pilih **"Go Live"**
3. Di bagian **Sources**, klik **+** → Pilih **Browser**
4. Paste link camera ke **URL**
5. Atur ukuran sesuai kebutuhan
6. Klik **Add**
7. Done!

---

## Integrasi dengan Streamlabs OBS

### Langkah-langkah:
1. Buka Streamlabs OBS
2. Di **Sources**, klik **+** → Pilih **Browser Source**
3. Klik **Add Source**
4. Paste link camera ke **URL**
5. Atur resolusi
6. Klik **Done**

---

## Tips Tambahan:

1. **Menggunakan OBS Virtual Camera**:
   - Setelah menambahkan Browser Source di OBS, klik **"Start Virtual Camera"**
   - Sekarang kamu bisa memilih "OBS Virtual Camera" di aplikasi manapun (Zoom, Teams, dll)

2. **Kualitas Video**:
   - Untuk kualitas terbaik, pastikan resolusi di Browser Source sesuai dengan resolusi kamera kamu

3. **Fullscreen**:
   - Halaman `/camera/{roomId}` otomatis fullscreen tanpa UI apapun, ideal untuk streaming
