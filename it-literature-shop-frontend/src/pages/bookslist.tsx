// src/pages/BooksList.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Axios instance kita
import { Link } from 'react-router-dom'; // Untuk link

// --- Tipe Data (Sesuai schema.prisma baru) ---
interface Genre {
  id: string;
  name: string;
}

interface Book {
  id: string;
  title: string;
  writer: string;
  publisher: string;
  price: number;
  stockQuantity: number;
  publicationYear: number | null;
  description: string | null;
  genre: Genre; // Kita include genre
}

interface Meta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  prev_page: number | null;
  next_page: number | null;
}
// --- Akhir Tipe Data ---

const BooksList = () => {
  // State untuk data dan UX
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);

  // State untuk query (search, filter, sort, pagination)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Default 10 item per halaman
  const [search, setSearch] = useState('');
  const [orderByTitle, setOrderByTitle] = useState<'asc' | 'desc' | ''>('asc');
  const [orderByPublishDate, setOrderByPublishDate] = useState<'asc' | 'desc' | ''>('');

  // --- useEffect untuk Fetch Data ---
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError(null);
      
      // Siapkan params untuk API call
      const params: any = {
        page: page,
        limit: limit,
      };
      
      // Hanya kirim parameter jika ada nilainya
      if (search) params.search = search;
      if (orderByTitle) params.orderByTitle = orderByTitle;
      if (orderByPublishDate) params.orderByPublishDate = orderByPublishDate;

      try {
        // Panggil API /books
        const response = await api.get('/books', { params });

        if (response.data && response.data.success) {
          setBooks(response.data.data);
          setMeta(response.data.meta);
        } else {
          setError(response.data.message || 'Gagal mengambil data buku.');
        }

      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Terjadi kesalahan saat mengambil data.');
        }
        console.error("Fetch books gagal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [page, limit, search, orderByTitle, orderByPublishDate]); // Dependency array

  // --- STYLING (Tema Gelap & Full Width) ---
  const pageWrapperStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 'calc(100vh - 65px)', // 100% tinggi layar dikurangi tinggi navbar (sesuaikan 65px jika perlu)
    backgroundColor: '#1e1e1e', // Latar belakang gelap
    color: '#e0e0e0', // Teks terang
    padding: '30px',
    boxSizing: 'border-box',
  };
  
  const contentContainerStyle: React.CSSProperties = {
    maxWidth: '1200px', // Konten tetap terpusat dan tidak terlalu lebar
    margin: '0 auto',
  };

  const controlsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // Agar responsif di mobile
    gap: '15px',
    marginBottom: '25px',
  };
  
  const inputStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '14px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 15px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    textAlign: 'center'
  };

  const bookGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', // Grid responsif
    gap: '25px'
  };

  const cardStyle: React.CSSProperties = {
    border: '1px solid #444',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#2a2a2a', // Kartu gelap
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  };

  const paginationStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '30px',
    gap: '10px'
  };
  // --- END STYLING ---


  // --- Render Functions ---

  // Fungsi untuk render state (loading, error, empty, data)
  const renderContent = () => {
    // 1. Loading State
    if (loading) {
      return <div style={{ textAlign: 'center', fontSize: '18px' }}>Loading books...</div>;
    }

    // 2. Error State
    if (error) {
      return <div style={{ color: '#ff8a80', textAlign: 'center', fontSize: '18px' }}>Error: {error}</div>;
    }

    // 3. Empty State
    if (books.length === 0) {
      return (
        <div style={{ textAlign: 'center', fontSize: '18px' }}>
          Belum ada buku yang tersedia. 
          <Link to="/books/add" style={{ color: '#007bff', marginLeft: '10px' }}>
            Tambah Buku Baru
          </Link>
        </div>
      );
    }

    // 4. Success State (Tampilkan data)
    return (
      <div style={bookGridStyle}>
        {books.map((book) => (
          <div key={book.id} style={cardStyle}>
            <div> {/* Wrapper untuk konten teks */}
              <h3 style={{ marginTop: 0, marginBottom: '10px', color: 'white' }}>{book.title}</h3>
              <p style={{ margin: '5px 0' }}><strong>Penulis:</strong> {book.writer}</p>
              <p style={{ margin: '5px 0' }}><strong>Genre:</strong> {book.genre?.name || 'N/A'}</p>
              <p style={{ margin: '5px 0' }}><strong>Harga:</strong> Rp {book.price.toLocaleString('id-ID')}</p>
              <p style={{ margin: '5px 0' }}><strong>Stok:</strong> {book.stockQuantity}</p>
            </div>
            {/* Wrapper untuk tombol */}
            <div style={{ marginTop: '20px' }}> 
              <Link 
                to={`/books/${book.id}`} 
                style={{...buttonStyle, backgroundColor: '#007bff', color: 'white', marginRight: '10px'}}
              >
                Lihat Detail
              </Link>
              {/* Tombol Hapus & Edit akan ditambahkan di sini */}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={contentContainerStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Katalog Buku</h1>
        
        {/* Kontrol Search, Filter, Sort */}
        <div style={controlsContainerStyle}>
          
          {/* Search Input */}
          <input
            type="text"
            placeholder="Cari buku, penulis..."
            value={search}
            onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // Reset ke halaman 1 saat search
            }}
            style={{ ...inputStyle, minWidth: '250px' }}
          />

          {/* Kontrol Sorting */}
          <div style={{ display: 'flex', gap: '15px' }}>
            <select 
              value={orderByTitle} 
              onChange={(e) => {
                  setOrderByTitle(e.target.value as 'asc' | 'desc' | '');
                  setOrderByPublishDate(''); // Reset sort lain
                  setPage(1);
              }}
              style={inputStyle}
            >
              <option value="asc">Judul (A-Z)</option>
              <option value="desc">Judul (Z-A)</option>
            </select>
            
            {/* Tambahan: Sort by Publish Date (sesuai Postman Collection) */}
            <select 
              value={orderByPublishDate} 
              onChange={(e) => {
                  setOrderByPublishDate(e.target.value as 'asc' | 'desc' | '');
                  setOrderByTitle(''); // Reset sort lain
                  setPage(1);
              }}
              style={inputStyle}
            >
              <option value="">Sortir Tanggal Terbit</option>
              <option value="asc">Terlama</option>
              <option value="desc">Terbaru</option>
            </select>
          </div>
          
          {/* Tombol Tambah Buku */}
          <Link 
            to="/books/add" 
            style={{...buttonStyle, backgroundColor: '#28a745', color: 'white'}}
          >
            + Tambah Buku
          </Link>
        </div>

        {/* Konten (Loading/Error/Empty/Data) */}
        {renderContent()}

        {/* Kontrol Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={paginationStyle}>
            <button 
              onClick={() => setPage(p => p - 1)} 
              disabled={!meta.prev_page || loading}
              style={{...buttonStyle, backgroundColor: '#555', color: 'white'}}
            >
              &laquo; Sebelumnya
            </button>
            <span style={{ margin: '0 15px' }}>
              Halaman {meta.page} dari {meta.totalPages}
            </span>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={!meta.next_page || loading}
              style={{...buttonStyle, backgroundColor: '#555', color: 'white'}}
            >
              Berikutnya &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BooksList;
