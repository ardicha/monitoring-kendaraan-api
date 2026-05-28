import express from 'express'
import prisma from '../prisma/client.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// GET /api/notifications — Daftar semua notifikasi
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      include: {
        vehicle: {
          select: { vehicle_id: true, plate_number: true }
        }
      }
    })

    res.json({ data: notifications, total: notifications.length })
  } catch (error) {
    console.error('GET /notifications error:', error.message)
    res.status(500).json({ error: 'Gagal mengambil notifikasi.' })
  }
})

// PATCH /api/notifications/:id/read — Tandai sudah dibaca
router.patch('/:id/read', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID tidak valid.' })

    const notification = await prisma.notification.update({
      where: { id },
      data: { is_read: true }
    })

    res.json({ message: 'Notifikasi ditandai sudah dibaca.', data: notification })
  } catch (error) {
    console.error('PATCH /notifications/:id/read error:', error.message)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan.' })
    }
    res.status(500).json({ error: 'Gagal memperbarui notifikasi.' })
  }
})

// PATCH /api/notifications/read-all — Tandai semua sudah dibaca
router.patch('/read-all', async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: { is_read: false },
      data: { is_read: true }
    })

    res.json({ message: `${result.count} notifikasi ditandai sudah dibaca.` })
  } catch (error) {
    console.error('PATCH /notifications/read-all error:', error.message)
    res.status(500).json({ error: 'Gagal memperbarui notifikasi.' })
  }
})

// DELETE /api/notifications/:id — Hapus notifikasi
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'ID tidak valid.' })

    await prisma.notification.delete({ where: { id } })

    res.json({ message: 'Notifikasi berhasil dihapus.' })
  } catch (error) {
    console.error('DELETE /notifications/:id error:', error.message)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Notifikasi tidak ditemukan.' })
    }
    res.status(500).json({ error: 'Gagal menghapus notifikasi.' })
  }
})

export default router