// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import api from '../services/api'; 
import { useAuth } from '../contexts/authcontext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

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
      // Panggil API backend /auth/login
      const response = await api.post('/auth/login', {
        username: username,
        password: password,
      });

      // Sesuaikan 'response.data.token' dengan struktur backend Anda
      // (Berdasarkan kode auth.routes.ts, seharusnya response.data.token)
      const token = response.data.token; 

      if (!token) {
        setError('Login berhasil, namun token tidak diterima dari server.');
        setLoading(false);
        return;
      }

  // Gunakan context.login agar AuthContext tahu user sudah login
  await login(token);

  // Arahkan user ke halaman daftar buku
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

  // --- STYLING (Inline CSS) ---
  // Style untuk wrapper agar full-screen dan center
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#1e1e1e', // Latar belakang gelap
    color: '#e0e0e0', // Teks terang
  };

  // Style untuk kotak login
  const boxStyle: React.CSSProperties = {
    maxWidth: '400px',
    width: '100%',
    margin: '20px',
    padding: '30px',
    border: '1px solid #444',
    borderRadius: '8px',
    backgroundColor: '#2a2a2a', // Latar belakang kotak
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  };

  // Style untuk input
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#333',
    color: 'white',
    boxSizing: 'border-box', // Penting agar padding tidak merusak layout
    fontSize: '16px'
  };

  // Style untuk tombol
  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    cursor: 'pointer',
    backgroundColor: loading ? '#555' : '#007bff', // Warna biru primer
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