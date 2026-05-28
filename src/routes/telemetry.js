import express from 'express'
import { authenticateDevice } from '../middleware/deviceKey.js'
import { gpsQueue } from '../jobs/queue.js'

const router = express.Router()

// POST /api/telemetry — Terima data GPS dari ESP32
// Header wajib: X-Device-Key: <DEVICE_API_KEY>
// Body JSON:
// {
//   "vehicle_id": "KBT-001",
//   "latitude": -7.330,
//   "longitude": 110.508,
// }
router.post('/', authenticateDevice, async (req, res) => {
  try {
    const { vehicle_id, latitude, longitude } = req.body

    // Validasi data wajib
    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        error: 'vehicle_id, latitude, dan longitude wajib diisi.'
      })
    }

    // Validasi range koordinat
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Koordinat tidak valid.' })
    }

    // Masukkan ke BullMQ queue — jangan proses langsung!
    // Ini agar response ke ESP32 cepat, tidak menunggu DB write
    await gpsQueue.add('processGps', {
      vehicle_id,
      latitude,
      longitude
    })

    // Response cepat ke ESP32
    res.status(202).json({
      message: 'Data GPS diterima.',
      queued_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Telemetry error:', error)
    res.status(500).json({ error: 'Gagal memproses data GPS.' })
  }
})

export default router
