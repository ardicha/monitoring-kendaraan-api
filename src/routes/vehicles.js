import express from 'express'
import prisma from '../prisma/client.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {},
      select: {
        id: true,
        vehicle_id: true,
        plate_number: true,
        vehicle_type: true,
        last_latitude: true,
        last_longitude: true,
        last_seen_at: true,
        is_active: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { vehicle_id: 'asc' }
    })
    res.json({ data: vehicles, total: vehicles.length })
  } catch (error) {
    console.error('GET /vehicles error:', error.message)
    res.status(500).json({ error: 'Gagal mengambil data kendaraan.' })
  }
})

// GET /api/vehicles/:id/latest
router.get('/:id/latest', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        vehicle_id: true,
        plate_number: true,
        last_latitude: true,
        last_longitude: true,
        last_seen_at: true,
      }
    })

    if (!vehicle) return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' })

    res.json({ data: vehicle })
  } catch (error) {
    console.error('Error latest:', error)
    res.status(500).json({ error: 'Gagal mengambil posisi kendaraan.' })
  }
})

// GET /api/vehicles/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const { start, end } = req.query
    if (!start || !end) {
      return res.status(400).json({ error: 'Parameter start dan end wajib diisi.' })
    }

    const logs = await prisma.vehicleLog.findMany({
      where: {
        vehicle_id: parseInt(req.params.id),
        recorded_at: {
          gte: new Date(start + 'T00:00:00.000Z'),
          lte: new Date(end + 'T23:59:59.999Z')
        }
      },
      select: {
        latitude: true,
        longitude: true,
        heading: true,
        recorded_at: true
      },
      orderBy: { recorded_at: 'asc' }
    })

    res.json({ data: logs, total: logs.length })
  } catch (error) {
    console.error('GET /vehicles/:id/history error:', error.message)
    res.status(500).json({ error: 'Gagal mengambil riwayat perjalanan.' })
  }
})

// GET /api/vehicles/:id/stats
router.get('/:id/stats', async (req, res) => {
  try {
    const vehicleId = parseInt(req.params.id)

    const stats = await prisma.vehicleLog.aggregate({
      where: { vehicle_id: vehicleId },
      _count: { id: true }
    })

    res.json({
      data: {
        total_data_points: stats._count.id,
        status: "Monitoring Active"
      }
    })
  } catch (error) {
    console.error('GET /vehicles/:id/stats error:', error.message)
    res.status(500).json({ error: 'Gagal mengambil statistik.' })
  }
})

// POST /api/vehicles
router.post('/', async (req, res) => {
  try {
    const { vehicle_id, plate_number, vehicle_type, user_id } = req.body

    if (!vehicle_id || !plate_number || !vehicle_type) {
      return res.status(400).json({ error: 'vehicle_id, plate_number, dan vehicle_type wajib diisi.' })
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        vehicle_id,
        plate_number,
        vehicle_type,
        user_id: user_id || req.user.userId
      }
    })

    res.status(201).json({ message: 'Kendaraan berhasil ditambahkan.', data: vehicle })
  } catch (error) {
    console.error('POST /vehicles error:', error.message)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'vehicle_id atau plate_number sudah terdaftar.' })
    }
    res.status(500).json({ error: 'Gagal menambahkan kendaraan.' })
  }
})

// PATCH /api/vehicles/:id
router.patch('/:id', async (req, res) => {
  try {
    const { plate_number, vehicle_type, is_active } = req.body

    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(req.params.id) },
      data: { plate_number, vehicle_type, is_active }
    })

    res.json({ message: 'Kendaraan berhasil diperbarui.', data: vehicle })
  } catch (error) {
    console.error('PATCH /vehicles/:id error:', error.message)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' })
    }
    res.status(500).json({ error: 'Gagal memperbarui kendaraan.' })
  }
})

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.update({
      where: { id: parseInt(req.params.id) },
      data: { is_active: false }
    })
    res.json({ message: 'Kendaraan berhasil dihapus.' })
  } catch (error) {
    console.error('DELETE /vehicles/:id error:', error.message)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' })
    }
    res.status(500).json({ error: 'Gagal menghapus kendaraan.' })
  }
})

export default router
