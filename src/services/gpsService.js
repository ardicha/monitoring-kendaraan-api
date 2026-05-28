const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius bumi dalam meter
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Hasil dalam meter
};

export const processGpsData = async (data) => {
    const { vehicle_id, latitude, longitude } = data;

    // Titik pusat Geofence (Contoh: Kantor Pemkot Salatiga)
    const centerPoint = { lat: -7.3305, lon: 110.5084 };
    const maxRadius = 5000; // Batas aman 5 KM dari pusat

    const distance = calculateDistance(latitude, longitude, centerPoint.lat, centerPoint.lon);
    
    let status = "AMAN";
    let alertType = null;

    // Hanya cek pelanggaran wilayah (Geofence)
    if (distance > maxRadius) {
        status = "OUT_OF_BOUNDS";
        alertType = "GEOFENCE_VIOLATION";
    }

    return {
        vehicle_id,
        latitude,
        longitude,
        distanceFromCenter: Math.round(distance),
        status,
        alertType,
        timestamp: new Date()
    };
};