// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  // Ganti URL ini dengan URL backend Anda (port 3000 atau 8080, dll)
  baseURL: 'http://localhost:3000', 
});

// Interceptor untuk menambahkan token ke header
api.interceptors.request.use(
  (config) => {
    // Ambil token dari local storage
    const token = localStorage.getItem('authToken'); 
    if (token) {
      // Set header Authorization jika token ada
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
