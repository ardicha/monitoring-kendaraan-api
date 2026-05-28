import express from 'express'
import prisma from '../prisma/client.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/geofences
router.get('/', async (req, res) => {
  try {
    const geofences = await prisma.geofence.findMany({
      orderBy: { created_at: 'desc' }
    })
    res.json({ data: geofences, total: geofences.length })
  } catch (error) {
    console.error('GET /geofences error:', error.message)
    res.status(500).json({ error: 'Gagal mengambil data geofence.' })
  }
})

// POST /api/geofences
router.post('/', async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body

    if (!name || latitude === undefined || longitude === undefined || !radius) {
      return res.status(400).json({ error: 'name, latitude, longitude, radius wajib diisi.' })
    }

    const geofence = await prisma.geofence.create({
      data: {
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseFloat(radius),
        is_active: true
      }
    })

    res.status(201).json({ message: 'Geofence berhasil dibuat.', data: geofence })
  } catch (error) {
    console.error('POST /geofences error:', error.message)
    res.status(500).json({ error: 'Gagal membuat geofence.' })
  }
})

// DELETE /api/geofences/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.geofence.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Geofence berhasil dihapus.' })
  } catch (error) {
    console.error('DELETE /geofences error:', error.message)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Geofence tidak ditemukan.' })
    }
    res.status(500).json({ error: 'Gagal menghapus geofence.' })
  }
})

export default router
