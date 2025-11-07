// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/authcontext';

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Tampilkan loading spinner/teks selagi context mengecek token
  if (loading) {
    return <div>Loading authentication...</div>;
  }

  // Jika tidak terotentikasi (setelah loading selesai), redirect ke /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Jika terotentikasi, tampilkan halaman yang diproteksi (nested routes)
  return <Outlet />;
};

export default ProtectedRoute;
