import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../prisma';

const router = Router();

// SECRET JWT 
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// ==========================================================
// REGISTER
// ==========================================================
router.post('/register', async (req: Request, res: Response) => {
  // 1. Ambil SEMUA data yang dibutuhkan dari body
const { username, password, email } = req.body; // <-- Tambahkan email di sini

// 2. Validasi input (Tambahkan cek untuk email)
if (!username || !password || !email) { // <-- Pastikan email juga ada
    // Anda mungkin ingin validasi format email juga di sini
    return res.status(400).json({ success: false, message: 'Username, password, and email are required', data: null });
}

try {
    // Cek user/email exist (mungkin perlu disesuaikan logikanya)
    const existingUser = await prisma.user.findFirst({
        where: { OR: [{ username: username }, { email: email }] },
    });

    if (existingUser) {
        const field = existingUser.username === username ? 'Username' : 'Email';
        return res.status(409).json({ success: false, message: `${field} already exists`, data: null });
    }

    // Hashing password (kode ini seharusnya sudah ada)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Buat user baru dengan menyertakan email
    const newUser = await prisma.user.create({
        data: { 
            username, 
            password: hashedPassword, 
            email // <-- Sertakan email di sini
        },
        // Select hanya field yang aman untuk dikembalikan
        select: { id: true, username: true, email: true, createdAt: true } 
    });

    // Kirim respons sukses
    return res.status(201).json({ success: true, message: 'User registered successfully', data: newUser });

} catch (error) {
    console.error('Error during registration:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', data: null });
}
});

// ==========================================================
// LOGIN
// ==========================================================
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
      expiresIn: '1h',
    });

    res.status(200).json({
      message: 'Login berhasil',
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ==========================================================
// GET ME (Profil Pengguna)
// ==========================================================
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Format Authorization tidak valid' });
    }

    // Verifikasi token
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === 'object' && 'id' in decoded && 'username' in decoded) {
      const { id } = decoded as { id: string; username: string };

      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, username: true, createdAt: true },
      });

      if (!user) {
        return res.status(404).json({ message: 'Pengguna tidak ditemukan' });
      }

      return res.status(200).json({ user });
    }

    return res.status(403).json({ message: 'Payload token tidak valid' });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa' });
  }
});

export default router;
