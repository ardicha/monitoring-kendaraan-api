import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import vehicleRoutes from './routes/vehicles.js';
import telemetryRoutes from './routes/telemetry.js';
import geofenceRoutes from './routes/geofences.js';
import notificationRoutes from './routes/notifications.js';
import { startWorker } from './jobs/processGps.js';

const app = express();
const httpServer = createServer(app);

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/notifications', notificationRoutes);

// Keep-alive ping setiap 10 menit agar server tidak tidur
setInterval(async () => {
  try {
    const http = await import('http')
    http.get(`http://localhost:${process.env.PORT || 3000}/api/health`)
    console.log('Keep-alive ping sent')
  } catch (e) {}
}, 10 * 60 * 1000)
// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Monitoring Kendaraan PEMKOT Salatiga',
    timestamp: new Date().toISOString()
  });
});

// ─── 404 Handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} tidak ditemukan.` });
});

// ─── Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message });
});

// ─── Socket.io ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('Client terhubung:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client terputus:', socket.id);
  });
});

export { io };

// ─── Start Worker ─────────────────────────────────────
startWorker(io);

// ─── Start Server ─────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`✅ Server aktif di http://localhost:${PORT}`);
});
