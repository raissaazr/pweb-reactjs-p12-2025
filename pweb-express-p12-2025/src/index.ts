// src/index.ts
import express, { Express, Request, Response } from 'express';
import transactionRoutes from './routes/transaction.routes';
import authRoutes from './routes/auth.routes';
import bookRoutes from './routes/books.routes'; // <-- Hanya import sekali
import genreRoutes from './routes/genre.routes';

// Inisialisasi Express app
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware untuk membaca JSON dari request body
app.use(express.json());

// Rute tes sederhana
app.get('/', (req: Request, res: Response) => {
  res.send('Selamat Datang di API IT Literature Shop!');
});

// === Rute-Rute ===
app.use('/auth', authRoutes);
app.use('/genre', genreRoutes);
app.use('/books', bookRoutes); // <-- Hanya daftarkan sekali
app.use('/transactions', transactionRoutes);

// === Rute Health Check (WAJIB ADA) ===
app.get('/health-check', (req: Request, res: Response) => {
    try {
        // Mengembalikan respons sesuai format standar
        res.status(200).json({
            success: true,
            message: 'API is healthy and running!',
            data: {
                timestamp: new Date().toISOString()
            } 
        });
    } catch (error) {
         console.error("Health check error:", error);
         res.status(500).json({
             success: false,
             message: 'Health check failed',
             data: null
         });
    }
});

// Mulai server
app.listen(port, () => {
  console.log(`[server]: Server berjalan di http://localhost:${port} 🚀`);
});