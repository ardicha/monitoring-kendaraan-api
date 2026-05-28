import prisma from '../prisma/client.js';

export async function checkGeofence({ vehicle, latitude, longitude }) {
  try {
    // Ambil semua geofence yang aktif
    const geofences = await prisma.geofence.findMany({
      where: { is_active: true }
    });

    for (const geofence of geofences) {
      const distance = getDistance(
        latitude, longitude,
        geofence.latitude, geofence.longitude
      );

      // Kalau kendaraan keluar dari radius geofence
      if (distance > geofence.radius) {
        await prisma.notification.create({
          data: {
            vehicle_id: vehicle.id,
            type: 'geofence_violation',
            message: `Kendaraan ${vehicle.plate_number} keluar dari zona ${geofence.name}`
          }
        });
      }
    }
  } catch (error) {
    console.error('Geofence check error:', error);
  }
}

// Hitung jarak dua koordinat dalam meter (Haversine formula)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}