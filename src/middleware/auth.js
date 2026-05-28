import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  // Mengambil token dari header Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Login terlebih dahulu.' });
  }

  try {
    // Verifikasi token menggunakan secret key dari .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Menyimpan data user ke request
    next(); // Lanjut ke proses berikutnya
  } catch (error) {
    return res.status(403).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
  }
}