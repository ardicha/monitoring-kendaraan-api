import { Worker } from 'bullmq'
import prisma from '../prisma/client.js'
import { redisConnection } from './queue.js'
import { checkGeofence } from '../services/geofenceService.js'

export function startWorker(io) {
  const worker = new Worker('gpsQueue', async (job) => {
    const { vehicle_id, latitude, longitude, speed, heading, timestamp } = job.data

    console.log(`🔄 Memproses GPS: ${vehicle_id} @ ${latitude},${longitude}`)

    // 1. Cari vehicle berdasarkan vehicle_id string
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id }
    })

    if (!vehicle) {
      console.warn(`⚠️ Kendaraan ${vehicle_id} tidak ditemukan di database.`)
      return
    }

    const recordedAt = timestamp ? new Date(timestamp) : new Date()

    // 2. Simpan log perjalanan
    await prisma.vehicleLog.create({
      data: {
        vehicle_id: vehicle.id,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || null,
        recorded_at: recordedAt,
      }
    })

    // 3. Update posisi terakhir di tabel vehicles
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: {
        last_latitude: latitude,
        last_longitude: longitude,
        last_speed: speed || 0,
        last_seen_at: recordedAt,
      }
    })

    // 4. Cek geofence (apakah kendaraan keluar area)
    await checkGeofence({ vehicle, latitude, longitude, speed, io })

    // 5. Broadcast ke semua frontend via Socket.io
    io.emit('vehicle:updated', {
      vehicle_id,
      latitude,
      longitude,
      speed,
      heading,
      timestamp: recordedAt.toISOString()
    })

    console.log(`✅ GPS ${vehicle_id} berhasil diproses.`)

  }, { connection: redisConnection })

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} gagal:`, err.message)
  })

  console.log('⚙️  BullMQ Worker "gpsQueue" aktif.')
}