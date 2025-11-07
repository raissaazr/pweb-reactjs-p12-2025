// src/pages/Checkout.tsx
import React, { useState } from 'react';
import { useCart } from '../contexts/cartcontext';
import { useAuth } from '../contexts/authcontext';
import api from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const Checkout = () => {
  const { cartItems, removeFromCart, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!user) {
      setError("Anda harus login untuk checkout.");
      return;
    }
    if (cartItems.length === 0) {
      setError("Keranjang Anda kosong.");
      return;
    }

    setLoading(true);
    setError(null);

    // Siapkan data untuk API (hanya ID dan quantity)
    const itemsToSubmit = cartItems.map(item => ({
      bookId: item.id,
      quantity: item.quantity
    }));

    try {
      // Panggil API backend /transactions (yang akan menjadi /orders)
      // Pastikan backend Anda sudah di-update ke skema 'Order'
      const response = await api.post('/transactions', {
        userId: user.id,
        items: itemsToSubmit
      });

      if (response.data && response.data.success) {
        // Berhasil!
        alert('Transaksi berhasil!'); // Ganti dengan notifikasi yang lebih baik
        clearCart(); // Kosongkan keranjang
        navigate('/transactions'); // Arahkan ke riwayat transaksi
      } else {
        setError(response.data.message || "Gagal melakukan transaksi.");
      }

    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan saat checkout.');
      }
      console.error("Checkout gagal:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- STYLING ---
  const pageWrapperStyle: React.CSSProperties = {
    width: '100%', minHeight: 'calc(100vh - 65px)', backgroundColor: '#1e1e1e',
    color: '#e0e0e0', padding: '30px', boxSizing: 'border-box',
  };
  const contentContainerStyle: React.CSSProperties = {
    maxWidth: '900px', margin: '0 auto', backgroundColor: '#2a2a2a',
    padding: '30px', borderRadius: '8px',
  };
  const tableStyle: React.CSSProperties = {
    width: '100%', borderCollapse: 'collapse', marginTop: '20px',
  };
  const thStyle: React.CSSProperties = {
    borderBottom: '2px solid #555', padding: '12px', textAlign: 'left',
  };
  const tdStyle: React.CSSProperties = {
    borderBottom: '1px solid #444', padding: '12px', verticalAlign: 'middle'
  };
  const buttonStyle: React.CSSProperties = {
    padding: '10px 15px', border: 'none', borderRadius: '4px',
    cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
  };
  const summaryStyle: React.CSSProperties = {
    marginTop: '20px', textAlign: 'right', fontSize: '18px',
  };
  // --- END STYLING ---

  return (
    <div style={pageWrapperStyle}>
      <div style={contentContainerStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Keranjang Belanja</h1>
        
        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', fontSize: '18px' }}>
            Keranjang Anda kosong. <Link to="/books" style={{ color: '#007bff' }}>Mulai belanja</Link>
          </div>
        ) : (
          <>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Buku</th>
                  <th style={thStyle}>Jumlah</th>
                  <th style={{...thStyle, textAlign: 'right'}}>Subtotal</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cartItems.map((item) => (
                  <tr key={item.id}>
                    <td style={tdStyle}>{item.title}</td>
                    <td style={tdStyle}>{item.quantity}</td>
                    <td style={{...tdStyle, textAlign: 'right'}}>
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        style={{...buttonStyle, backgroundColor: '#dc3545', color: 'white'}}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={summaryStyle}>
              <p>
                <strong>Total Harga: </strong> 
                <span style={{fontSize: '22px', fontWeight: 'bold', color: '#80ff8a', marginLeft: '10px'}}>
                  Rp {getCartTotal().toLocaleString('id-ID')}
                </span>
              </p>
              
              {error && <p style={{ color: '#ff8a80', textAlign: 'right', marginBottom: '15px' }}>{error}</p>}

              <button
                onClick={handleCheckout}
                disabled={loading}
                style={{...buttonStyle, backgroundColor: loading ? '#555' : '#28a745', color: 'white', fontSize: '18px', padding: '15px 25px'}}
              >
                {loading ? 'Memproses...' : 'Konfirmasi Pembelian'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Checkout;