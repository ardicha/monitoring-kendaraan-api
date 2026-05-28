export const sendLiveUpdate = (io, payload) => {
    // 1. Kirim update lokasi rutin untuk ditampilkan di peta
    io.emit('vehicle:updated', {
        id: payload.vehicle_id,
        lat: payload.latitude,
        lng: payload.longitude,
        dist: `${payload.distanceFromCenter}m dari pusat`,
        status: payload.status
    });

    // 2. Kirim peringatan khusus jika statusnya "OUT_OF_BOUNDS"
    if (payload.status === "OUT_OF_BOUNDS") {
        console.warn(`🚨 GEOFENCE ALERT: Kendaraan ${payload.vehicle_id} keluar zona!`);
        
        io.emit('vehicle:alert', {
            id: payload.vehicle_id,
            type: "PELANGGARAN_WILAYAH",
            message: `Armada berada di luar jangkauan (Jarak: ${payload.distanceFromCenter} meter)`,
            time: payload.timestamp.toLocaleTimeString()
        });
    }
};