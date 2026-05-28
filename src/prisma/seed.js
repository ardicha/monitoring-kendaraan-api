import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from './client.js'

async function main() {
  console.log('🌱 Mulai seeding database...')

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // Buat user admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pemkot-salatiga.go.id' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@pemkot-salatiga.go.id',
      password: hashedPassword,
      role: 'admin'
    }
  })

  console.log('✅ User admin dibuat:', admin.email)

  // Buat beberapa kendaraan contoh
  const kendaraan = [
    { vehicle_id: 'KBT-001', plate_number: 'H 1234 AB', vehicle_type: 'mobil', user_id: admin.id },
    { vehicle_id: 'KBT-002', plate_number: 'H 5678 CD', vehicle_type: 'motor', user_id: admin.id },
    { vehicle_id: 'KBT-003', plate_number: 'H 9012 EF', vehicle_type: 'truk', user_id: admin.id },
  ]

  for (const k of kendaraan) {
    await prisma.vehicle.upsert({
      where: { vehicle_id: k.vehicle_id },
      update: {},
      create: k
    })
    console.log(`✅ Kendaraan ${k.vehicle_id} dibuat`)
  }

  console.log('🎉 Seeding selesai!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())