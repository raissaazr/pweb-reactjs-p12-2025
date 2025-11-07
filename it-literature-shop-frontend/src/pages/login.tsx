// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api'; 
import { useAuth } from '../contexts/authcontext'; // <-- 1. IMPORT useAuth

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- 2. AMBIL FUNGSI login DARI CONTEXT

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(null); 
    setLoading(true); 

    if (!username || !password) {
      setError('Username dan password wajib diisi');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        username: username,
        password: password,
      });

      // (Struktur ini sesuai dengan backend Anda)
      const token = response.data.token; 

      if (!token) {
        setError('Login berhasil, namun token tidak diterima dari server.');
        setLoading(false);
        return;
      }

      // === PERUBAHAN UTAMA ===
      // 3. Panggil fungsi login() dari context.
      // Fungsi ini akan:
      //    a. Menyimpan token ke localStorage
      //    b. Memanggil /auth/me untuk dapat data user
      //    c. Mengubah state global 'isAuthenticated' menjadi true
      await login(token); 
      
      // 4. Arahkan user ke halaman daftar buku
      navigate('/books'); 

    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Terjadi kesalahan saat login.');
      }
      console.error("Login gagal:", err);
    } finally {
      setLoading(false); 
    }
  };

  // --- STYLING (Tetap sama) ---
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
    backgroundColor: loading ? '#555' : '#007bff',
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
        <h2 style={{ textAlign: 'center', marginBottom: '25px' }}>Login</h2>
        <form onSubmit={handleLogin}>
          {/* ... (Kode JSX form tetap sama) ... */}
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
            <label htmlFor="password" style={{ display: 'block', marginBottom: '8px' }}>Password:</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={inputStyle}
              autoComplete="current-password"
            />
          </div>
          
          {error && <p style={{ color: '#ff8a80', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading} 
            style={buttonStyle}
          >
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Belum punya akun? <Link to="/register" style={{ color: '#007bff', textDecoration: 'none' }}>Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
