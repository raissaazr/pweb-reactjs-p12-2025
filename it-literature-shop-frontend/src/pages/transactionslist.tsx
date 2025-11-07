// src/pages/TransactionsList.tsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import useAuth

// --- Tipe Data (Sesuaikan dengan respons API Backend Anda) ---
// Pastikan tipe ini cocok dengan apa yang dikirim oleh GET /transactions
// Ini didasarkan pada schema.prisma baru (model Order, OrderItem)
interface OrderItem {
  id: string;
  quantity: number;
  bookId: string;
  bookTitle?: string; // Asumsi backend mengirim ini
  subtotalPrice?: number; // Asumsi backend mengirim ini
}

interface Order {
  id: string; // UUID
  userId: string;
  createdAt: string; // ISO Date String
  updatedAt: string;
  totalQuantity: number; // Asumsi backend mengkalkulasi & mengirim ini
  totalPrice: number; // Asumsi backend mengkalkulasi & mengirim ini
  items: OrderItem[];
  user: {
    username: string;
  };
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

const TransactionsList = () => {
  // State untuk data dan UX
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const { user } = useAuth(); // Dapatkan data user yang login

  // State untuk query (sesuai requirement)
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // Tetapkan limit per halaman
  const [searchId, setSearchId] = useState('');
  
  // State untuk sorting
  const [sortField, setSortField] = useState<'id' | 'amount' | 'price' | ''>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Efek untuk fetch data
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page,
        limit,
      };
      
      // Tambahkan parameter query jika ada nilainya
      if (searchId) params.search = searchId;
      
      // Tentukan parameter sorting
      // Backend Anda harus di-update untuk mengenali query 'orderBy' ini
      if (sortField === 'id') {
        params.orderById = sortOrder;
      } else if (sortField === 'amount' || sortField === 'price') {
         // Asumsi 'amount'/'price' merujuk ke total harga
        params.orderByAmount = sortOrder; 
      }

      try {
        // Panggil API /transactions
        // Pastikan backend GET /transactions bisa memfilter berdasarkan user ID
        // atau idealnya, backend sudah otomatis memfilter berdasarkan token JWT
        const response = await api.get('/transactions', { params }); 

        if (response.data && response.data.success) {
          setOrders(response.data.data);
          setMeta(response.data.meta || null);
        } else {
          setError(response.data.message || 'Gagal mengambil data transaksi.');
        }

      } catch (err: any) {
        if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Terjadi kesalahan saat mengambil data.');
        }
        console.error("Fetch transactions gagal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    // Kita juga tambahkan sortField dan sortOrder ke dependency array
  }, [page, limit, searchId, sortField, sortOrder, user]); // 'user' ditambahkan agar fetch ulang jika user berubah

  // --- STYLING (Tema Gelap) ---
  const pageWrapperStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 'calc(100vh - 65px)',
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    padding: '30px',
    boxSizing: 'border-box',
  };
  const contentContainerStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
  };
  const controlsContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '15px',
    marginBottom: '25px',
  };
  const inputStyle: React.CSSProperties = {
    padding: '10px', borderRadius: '4px', border: '1px solid #555',
    backgroundColor: '#333', color: 'white', fontSize: '14px',
  };
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#2a2a2a',
  };
  const thStyle: React.CSSProperties = {
    border: '1px solid #444', padding: '12px', textAlign: 'left',
    backgroundColor: '#333',
  };
  const tdStyle: React.CSSProperties = {
    border: '1px solid #444', padding: '12px',
  };
  const linkStyle: React.CSSProperties = {
    color: '#007bff', textDecoration: 'none', fontWeight: 'bold'
  };
  const buttonStyle: React.CSSProperties = {
     padding: '8px 12px', margin: '0 5px', cursor: 'pointer',
     backgroundColor: '#555', color: 'white', border: 'none', borderRadius: '4px'
  };
  const paginationStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    marginTop: '30px', gap: '10px'
  };
  // --- END STYLING ---

  // Fungsi untuk mengganti sorting
  const handleSortChange = (field: 'id' | 'amount') => {
    const newSortOrder = (sortField === field && sortOrder === 'asc') ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
    setPage(1); // Reset ke halaman 1 saat sorting
  };

  // --- Render Functions ---
  const renderContent = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', fontSize: '18px' }}>Loading riwayat transaksi...</div>;
    }
    if (error) {
      return <div style={{ color: '#ff8a80', textAlign: 'center', fontSize: '18px' }}>Error: {error}</div>;
    }
    if (orders.length === 0) {
      return <div style={{ textAlign: 'center', fontSize: '18px' }}>Belum ada riwayat transaksi.</div>;
    }

    // Tampilkan tabel riwayat
    return (
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>
              <button onClick={() => handleSortChange('id')} style={{...linkStyle, background: 'none', border: 'none', cursor: 'pointer'}}>
                ID Transaksi {sortField === 'id' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th style={thStyle}>Tanggal</th>
            <th style={thStyle}>Jumlah Item</th>
            <th style={thStyle}>
              <button onClick={() => handleSortChange('amount')} style={{...linkStyle, background: 'none', border: 'none', cursor: 'pointer'}}>
                Total Harga {sortField === 'amount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
              </button>
            </th>
            <th style={thStyle}>Detail</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={tdStyle} title={order.id}>{order.id.substring(0, 8)}...</td>
              <td style={tdStyle}>{new Date(order.createdAt).toLocaleString('id-ID')}</td>
              <td style={tdStyle}>{order.totalQuantity} item</td>
              <td style={tdStyle}>Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</td>
              <td style={tdStyle}>
                <Link to={`/transactions/${order.id}`} style={linkStyle}>
                  Lihat Detail
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={contentContainerStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Riwayat Transaksi</h1>
        
        {/* Kontrol Search */}
        <div style={controlsContainerStyle}>
          <input
            type="text"
            placeholder="Cari berdasarkan ID Transaksi..."
            value={searchId}
            onChange={(e) => {
                setSearchId(e.target.value);
                setPage(1); // Reset ke halaman 1
            }}
            style={{ ...inputStyle, minWidth: '300px' }}
          />
        </div>

        {/* Konten (Loading/Error/Empty/Table) */}
        {renderContent()}

        {/* Kontrol Pagination */}
        {meta && meta.totalPages > 1 && (
          <div style={paginationStyle}>
            <button 
              onClick={() => setPage(p => p - 1)} 
              disabled={!meta.prev_page || loading}
              style={buttonStyle}
            >
              &laquo; Sebelumnya
            </button>
            <span>
              Halaman {meta.page} dari {meta.totalPages}
            </span>
            <button 
              onClick={() => setPage(p => p + 1)} 
              disabled={!meta.next_page || loading}
              style={buttonStyle}
            >
              Berikutnya &raquo;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;
