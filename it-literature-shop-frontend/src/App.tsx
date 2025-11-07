// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/login';
import Register from './pages/register';
import BooksList from './pages/bookslist';
import BookDetail from './pages/bookdetail';
import AddBook from './pages/addbook';
import TransactionsList from './pages/transactionslist';
import TransactionDetail from './pages/transactiondetail';
import Navbar from './components/navbar'; // <-- IMPORT NAVBAR
import ProtectedRoute from './components/protectedroute'; // <-- IMPORT PROTECTED ROUTE

function App() {
  return (
    <BrowserRouter>
      <Navbar /> {/* <-- Tambahkan Navbar di sini */}
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rurute yang Diproteksi */}
        <Route element={<ProtectedRoute />}> {/* <-- Gunakan wrapper ini */}
          {/* Semua halaman di dalam sini hanya bisa diakses setelah login */}
          <Route path="/" element={<BooksList />} />
          <Route path="/books" element={<BooksList />} />
          <Route path="/books/add" element={<AddBook />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/transactions" element={<TransactionsList />} />
          <Route path="/transactions/:id" element={<TransactionDetail />} />
        </Route>

        {/* Rute 404 (Opsional) */}
        <Route path="*" element={<div>404 - Halaman Tidak Ditemukan</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
