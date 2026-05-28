import { Queue } from 'bullmq'
import { URL } from 'url'

const getRedisConnection = () => {
  if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL)
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
    }
  }
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  }
}

export const redisConnection = getRedisConnection()

export const gpsQueue = new Queue('gpsQueue', { connection: redisConnection })

console.log('📦 BullMQ Queue "gpsQueue" siap, host:', redisConnection.host)
