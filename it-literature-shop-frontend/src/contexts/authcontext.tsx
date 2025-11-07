// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

// Tipe untuk data user (sesuaikan dengan respons /auth/me Anda)
interface User {
  id: string;
  username: string;
  email?: string; // Dibuat opsional
}

// Tipe untuk nilai yang disediakan oleh Context
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// Buat Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Buat Provider (komponen yang membungkus aplikasi)
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Loading saat pertama kali cek token

  useEffect(() => {
    // Cek token saat aplikasi pertama kali dimuat
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // Panggil /auth/me untuk verifikasi token dan dapatkan data user
          // Sesuaikan 'response.data.user' jika struktur /auth/me Anda berbeda
          const response = await api.get('/auth/me'); 
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Token tidak valid:", error);
          localStorage.removeItem('authToken'); // Hapus token kadaluwarsa
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('authToken', token);
    setLoading(true);
    try {
      // Panggil /auth/me untuk dapatkan data user setelah login
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Gagal fetch user setelah login:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    // Navigasi ke /login akan ditangani di komponen Navbar/ProtectedRoute
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Buat custom hook untuk mempermudah penggunaan context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
