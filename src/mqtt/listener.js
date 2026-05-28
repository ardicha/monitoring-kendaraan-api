import mqtt from 'mqtt';
import { gpsQueue } from '../jobs/queue.js'; // Import queue BullMQ kamu

export const startMqttListener = () => {
   // Menggunakan broker gratisan dari EMQX
const client = mqtt.connect('mqtt://broker.emqx.io:1883');

    client.on('connect', () => {
        console.log('📡 Terkoneksi ke Broker MQTT');
        
        client.subscribe('v1/vehicles/+/gps', (err) => {
            if (!err) {
                console.log('✅ Berhasil subscribe ke topik GPS kendaraan');
            }
        });
    });

    client.on('message', async (topic, message) => {
        try {
            // Parse data dari JSON yang dikirim ESP32
            const rawData = JSON.parse(message.toString());
            
            // Ambil vehicle_id dari topik (misal topik: v1/vehicles/KBT-01/gps)
            const topicParts = topic.split('/');
            const vehicleIdFromTopic = topicParts[2]; 

            // Validasi data minimal
            if (!rawData.latitude || !rawData.longitude) {
                console.warn(`⚠️ Data GPS dari ${vehicleIdFromTopic} tidak lengkap.`);
                return;
            }

            // Masukkan data ke BullMQ Queue
            await gpsQueue.add('process-gps', {
                vehicle_id: vehicleIdFromTopic || rawData.vehicle_id,
                latitude: parseFloat(rawData.latitude),
                longitude: parseFloat(rawData.longitude),
                heading: rawData.heading || null,
                timestamp: rawData.timestamp || new Date().toISOString()
            }, {
                removeOnComplete: true, // Bersihkan memori Redis jika sukses
                attempts: 3             // Coba lagi 3 kali jika gagal
            });

            console.log(`📥 Data dari ${vehicleIdFromTopic} dimasukkan ke antrean.`);
            
        } catch (error) {
            console.error('🔥 Gagal memproses pesan MQTT:', error.message);
        }
    });

    client.on('error', (err) => {
        console.error('❌ MQTT Connection Error:', err);
    });
};