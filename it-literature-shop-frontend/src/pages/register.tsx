// src/pages/Register.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import api from '../services/api'; // Import Axios kita

const Register = () => {
  // State untuk input form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // State untuk UX
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // State untuk pesan sukses

  const navigate = useNavigate();

  // Fungsi yang dipanggil saat form disubmit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validasi Sisi Klien
    if (!username || !password || !email) {
      setError('Username, email, dan password wajib diisi');
      setLoading(false);
      return;
    }
    // Anda bisa tambahkan validasi format email di sini

    try {
      // Panggil API backend /auth/register
      // (Pastikan backend Anda menggunakan field `email` sesuai skema)
      const response = await api.post('/auth/register', {
        username: username,
        email: email,
        password: password,
      });

      // Tampilkan pesan sukses
      setSuccess('Registrasi berhasil! Anda akan diarahkan ke halaman login.');

      // Tunggu 2 detik lalu arahkan ke halaman login
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      // Tangani error dari API
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // Tampilkan pesan error dari backend
      } else {
        setError('Terjadi kesalahan saat registrasi.');
      }
      console.error("Registrasi gagal:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- STYLING (Sama seperti Login) ---
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1e1e1e',
    color: '#e0e0e0',
  };

  const boxStyle: React.CSSProperties = {
    maxWidth: '400px',
    width: '100%',
    margin: '20px',
    padding: '30px',
    border: '1px solid #444',
    borderRadius: '8px',
    backgroundColor: '#2a2a2a',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: 'white',
    boxSizing: 'border-box',
    fontSize: '16px'
  };

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    cursor: 'pointer',
    backgroundColor: loading ? '#555' : '#28a745', // Warna hijau untuk register
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'background-color 0.2s',
  };
  // --- END STYLING ---

  return (
    <div style={pageStyle}>
      <div style={boxStyle}>
        <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Register</h2>
        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="username" style={{ display: 'block', marginBottom: '8px' }}>Username:</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={inputStyle}
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '8px' }}>Email:</label>
            <input
              id="email"
              type="email" // Tipe input email untuk validasi browser
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={inputStyle}
              autoComplete="email"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px' }}>Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
          
          {error && <p style={{ color: '#ff8a80', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          {success && <p style={{ color: '#80ff8a', textAlign: 'center', marginBottom: '15px' }}>{success}</p>}
          
          <button 
            type="submit" 
            disabled={loading} 
            style={buttonStyle}
          >
            {loading ? 'Loading...' : 'Register'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Sudah punya akun? <Link to="/login" style={{ color: '#007bff', textDecoration: 'none' }}>Login di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;