// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/cartcontext'; // <-- 1. IMPORT useCart

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { getTotalItems } = useCart(); // <-- 2. GUNAKAN useCart
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- (Styling tetap sama) ---
  const navStyle: React.CSSProperties = {
    backgroundColor: '#2a2a2a', padding: '15px 30px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
    borderBottom: '1px solid #444', color: 'white',
  };
  const linkStyle: React.CSSProperties = {
    color: 'white', textDecoration: 'none', margin: '0 10px', fontSize: '16px',
  };
  const buttonStyle: React.CSSProperties = {
    backgroundColor: 'transparent', border: '1px solid #007bff', color: '#007bff',
    padding: '8px 12px', borderRadius: '4px', cursor: 'pointer',
    marginLeft: '10px', fontSize: '14px',
  };
  // --- END STYLING ---

  return (
    <nav style={navStyle}>
      <div>
        <Link to={isAuthenticated ? "/books" : "/login"} style={{ ...linkStyle, fontSize: '20px', fontWeight: 'bold' }}>
          IT Literature Shop
        </Link>
        {isAuthenticated && (
          <Link to="/transactions" style={linkStyle}>
            Transaksi
          </Link>
        )}
      </div>
      <div>
        {isAuthenticated ? (
          <>
            <span style={{ margin: '0 10px' }}>
              Hi, {user?.username || 'User'}
            </span>

            {/* 3. TAMBAHKAN LINK KERANJANG */}
            <Link to="/checkout" style={{...linkStyle, fontWeight: 'bold'}}>
              Keranjang ({getTotalItems()})
            </Link>

            <button onClick={handleLogout} style={buttonStyle}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={linkStyle}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
