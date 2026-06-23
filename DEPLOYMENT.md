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

### 4. Testing di OBS
1. Buka link camera kamu di browser terlebih dahulu untuk izin kamera
2. Buka OBS → Add **Browser Source**
3. Paste URL camera kamu (contoh: `https://vdo-ninja.vercel.app/camera/abc123`)
4. Set ukuran sesuai kebutuhan
5. Selesai!

---

## Layanan Hosting Gratis Lainnya:
- **Railway**: Free tier $5/bulan, perlu kartu kredit verifikasi
- **Fly.io**: Free untuk 3 apps kecil, perlu kartu kredit

