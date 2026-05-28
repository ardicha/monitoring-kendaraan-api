# 🛰️ Monitoring Kendaraan API (Backend)
**Sistem Informasi Geografis Armada Dinas - PEMKOT Salatiga**

Dokumentasi ini mencakup spesifikasi REST API, integrasi IoT (ESP32), dan manajemen antrian data menggunakan Node.js Stack.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime:** Node.js v20 LTS
* **Framework:** Express.js
* **ORM:** Prisma (MySQL 8)
* **Real-time:** Socket.io (Protokol WebSocket)
* **Task Queue:** BullMQ + Redis (Asynchronous Processing)
* **Communication:** MQTT (Alternative IoT Gateway)

---

## 🔑 Mekanisme Autentikasi

API ini menggunakan dua metode pengamanan berbeda berdasarkan tipe aktor:

1.  **User Access (Web Dashboard):** Menggunakan `Authorization: Bearer <JWT_TOKEN>`.
2.  **IoT Device Access (ESP32):** Menggunakan Custom Header `X-Device-Key: <UNIQUE_API_KEY>`.

---

## 🛰️ Endpoint Telemetri (IoT ke Server)

Endpoint ini dirancang untuk menerima beban data tinggi secara berkala dari perangkat keras.

### POST `/api/telemetry`
Menerima data koordinat GPS dari modul Neo-6M melalui ESP32.

* **Auth:** `X-Device-Key` (Header)
* **Payload:**
    ```json
    {
      "vehicle_id": "KBT-001",
      "latitude": -7.3306,
      "longitude": 110.4981,
      "speed": 45.2,
      "heading": 90,
      "timestamp": "2025-04-01T08:30:00Z"
    }
    ```
* **Proses Internal:**
    1. Validasi API Key perangkat.
    2. Data masuk ke **BullMQ Queue**.
    3. Worker melakukan pengecekan **Geofence** (Inclusion/Exclusion).
    4. Update posisi terakhir di tabel `vehicles`.
    5. Emit data ke Dashboard via **Socket.io**.

---

## 📋 Endpoint Manajemen & Monitoring (Dashboard)

| Method | Endpoint | Fungsi |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Mendapatkan JWT Token |
| **GET** | `/api/vehicles` | List semua kendaraan & posisi *live* | 
| **GET** | `/api/vehicles/:id/history` | Riwayat koordinat (filter tanggal) |
| **POST** | `/api/vehicles` | Registrasi kendaraan & Generate API Key | 
| **GET** | `/api/geofences` | List area Geofence aktif |
| **GET** | `/api/notifications` | Log peringatan (Overspeed/Geofence) | 

---

## 🔄 Event Real-time (Socket.io)

Backend akan memancarkan (*broadcast*) event berikut ke klien yang terhubung:

* `vehicle:updated`: Mengirim data posisi terbaru setiap kali telemetri diterima.
* `vehicle:alert`: Mengirim peringatan jika terjadi pelanggaran batas area.
* `vehicle:offline`: Dipicu jika perangkat tidak mengirim data lebih dari 5 menit.

---

## ⚙️ Setup Environment (`.env`)

```env
# Database
DATABASE_URL="mysql://root:password@localhost:3306/pemkot_vehicle"

# Redis (Untuk BullMQ & Cache)
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="salatiga_smart_city_secret"
PORT=3000
