# Panduan Deployment

## Masalah Utama
Vercel hanya bisa men-deploy Next.js frontend. Socket.io server yang kita buat tidak bisa berjalan di Vercel karena Vercel adalah platform untuk Serverless Functions, bukan untuk long-running server.

## Langkah-langkah Deployment (Gratis!)

### 1. Deploy Socket.io Server ke **Render** (Paling Mudah & 100% Gratis)
Render adalah pilihan terbaik karena free tier-nya tidak memerlukan kartu kredit dan server tidak sleep.

Langkah-langkah:
1. Upload seluruh project kamu ke GitHub
2. Buka [render.com](https://render.com) dan buat akun
3. Klik **New +** → Pilih **Web Service**
4. Connect GitHub repo kamu
5. Configure:
   - **Name**: vdo-ninja-socket (atau terserah)
   - **Region**: pilih yang dekat dengan kamu
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: (kosongkan)
   - **Start Command**: `node server.js`
   - **Instance Type**: Free
6. Klik **Create Web Service**
7. Tunggu beberapa menit hingga selesai
8. Setelah selesai, kamu dapatkan URL seperti `https://vdo-ninja-socket.onrender.com`

### 2. Set Environment Variable di Render
Di Render dashboard, buka project kamu → **Environment**:
- Tambahkan variable:
  - Key: `ALLOWED_ORIGIN`
  - Value: URL Vercel kamu (contoh: `https://vdo-ninja.vercel.app`)
- Klik **Save Changes**

### 3. Set Environment Variable di Vercel
1. Buka project Vercel kamu → **Settings** → **Environment Variables**
2. Tambahkan variable:
   - Name: `NEXT_PUBLIC_SOCKET_URL`
   - Value: URL Socket.io server di Render (contoh: `https://vdo-ninja-socket.onrender.com`)
3. Klik **Save**
4. Redeploy project Vercel kamu (Deployments → ... → Redeploy)

### 4. Testing (Step-by-Step)
1. **Buka link di browser TERLEBIH DAHULU** (contoh: `https://vdo-ninja.vercel.app/camera/abc123`)
   - Klik **Allow** ketika browser meminta izin kamera
   - Pastikan kamu melihat video kamu di browser
   
2. **Buka OBS**
   - Tambahkan **Browser Source**
   - Paste URL camera kamu
   - Set ukuran (contoh: 1920x1080)
   - Centang **Refresh browser when scene becomes active**
   - Klik **OK**
   
3. **Jika tidak muncul**:
   - Klik kanan Browser Source di OBS → **Interact**
   - Di jendela Interact, klik **Allow** untuk izin kamera (jika muncul)
   - Atau, buka OBS → Settings → Advanced → Set "Browser Source Hardware Acceleration" ke **Off**

### 5. Debug Checklist
Pastikan semua hal ini sudah di-setup:
- ✅ Socket.io server berjalan di Railway (cekt logs Railway)
- ✅ Env var `NEXT_PUBLIC_SOCKET_URL` di Vercel di-set dengan URL Railway
- ✅ Env var `ALLOWED_ORIGIN` di Railway di-set dengan URL Vercel
- ✅ Vercel sudah di-redeploy setelah set env var
- ✅ Kamu sudah buka link di browser dan allow kamera

---

## Layanan Hosting Gratis Lainnya:
- **Railway**: Free tier $5/bulan, perlu kartu kredit verifikasi
- **Fly.io**: Free untuk 3 apps kecil, perlu kartu kredit

