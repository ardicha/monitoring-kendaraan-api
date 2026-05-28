export function authenticateDevice(req, res, next) {
  const deviceKey = req.headers['x-device-key']

  if (!deviceKey || deviceKey !== process.env.DEVICE_API_KEY) {
    return res.status(401).json({ error: 'API Key perangkat tidak valid.' })
  }

  next()
}