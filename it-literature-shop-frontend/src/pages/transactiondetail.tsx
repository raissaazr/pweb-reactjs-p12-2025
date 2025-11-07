// src/pages/TransactionDetail.tsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// --- Tipe Data ---
interface OrderItem {
  id: string;
  quantity: number;
  bookId: string;
  bookTitle?: string; 
  subtotalPrice?: number;
  book?: {
    writer: string;
  }
}
interface Order {
  id: string; 
  userId: string;
  createdAt: string;
  updatedAt: string;
  totalQuantity: number; 
  totalPrice: number;
  items: OrderItem[];
  user: { username: string };
}
// ---

const TransactionDetail = () => {
  const { id } = useParams<{ id: string }>(); 
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return; 

    const fetchOrderDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/transactions/${id}`); 
        
        if (response.data && response.data.success) {
          setOrder(response.data.data);
        } else {
          setError(response.data.message || 'Gagal mengambil detail transaksi.');
        }
      } catch (err: any) {
        if (err.response && err.response.status === 404) {
          setError('Transaksi tidak ditemukan.');
        } else if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
        } else {
          setError('Terjadi kesalahan saat mengambil data.');
        }
        console.error("Fetch detail transaksi gagal:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]); 

  // --- STYLING ---
  const pageWrapperStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 'calc(100vh - 65px)',
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
    padding: '30px',
    boxSizing: 'border-box',
  };
  const contentContainerStyle: React.CSSProperties = {
    maxWidth: '900px',
    margin: '0 auto',
    backgroundColor: '#2a2a2a',
    padding: '30px',
    borderRadius: '8px',
  };
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px',
  };
  const thStyle: React.CSSProperties = {
    borderBottom: '2px solid #555', padding: '12px', textAlign: 'left',
  };
  const tdStyle: React.CSSProperties = {
    borderBottom: '1px solid #444', padding: '12px',
  };
  const summaryStyle: React.CSSProperties = {
    marginTop: '20px',
    textAlign: 'right',
    fontSize: '18px',
  };
  // --- END STYLING ---

  // --- Render Functions ---
  const renderContent = () => {
    if (loading) {
      return <div style={{ textAlign: 'center', fontSize: '18px' }}>Loading detail transaksi...</div>;
    }
    if (error) {
      return <div style={{ color: '#ff8a80', textAlign: 'center', fontSize: '18px' }}>Error: {error}</div>;
    }
    if (!order) {
      return <div style={{ textAlign: 'center', fontSize: '18px' }}>Data transaksi tidak ditemukan.</div>;
    }

    // Tampilkan detail
    return (
      <>
        <p><strong>ID Transaksi:</strong> {order.id}</p>
        <p><strong>Tanggal:</strong> {new Date(order.createdAt).toLocaleString('id-ID')}</p>
        <p><strong>Dibeli oleh:</strong> {order.user?.username || 'N/A'}</p>
        
        <h3 style={{ marginTop: '30px' }}>Item yang Dibeli:</h3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Judul Buku</th>
              <th style={thStyle}>Jumlah</th>
              {/* === INI ADALAH PERBAIKANNYA === */}
              <th style={{ ...thStyle, textAlign: 'right' }}> 
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td style={tdStyle}>
                  <Link to={`/books/${item.bookId}`} style={{color: '#00aaff'}}>
                    {item.bookTitle || `Buku (ID: ${item.bookId})`}
                  </Link>
                </td>
                <td style={tdStyle}>{item.quantity}</td>
                <td style={{...tdStyle, textAlign: 'right'}}>
                  Rp {(item.subtotalPrice || 0).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={summaryStyle}>
          <p><strong>Total Item:</strong> {order.totalQuantity}</p>
          <p><strong>Total Harga:</strong> <span style={{fontSize: '22px', fontWeight: 'bold', color: '#80ff8a'}}>Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</span></p>
        </div>
      </>
    );
  };

  return (
    <div style={pageWrapperStyle}>
      <div style={contentContainerStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Detail Transaksi</h1>
        <Link to="/transactions" style={{ color: '#007bff' }}>&larr; Kembali ke Riwayat</Link>
        
        <div style={{ marginTop: '20px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;
