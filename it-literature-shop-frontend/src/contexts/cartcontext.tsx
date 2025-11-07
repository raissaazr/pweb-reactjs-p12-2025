// src/contexts/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Tipe untuk item di keranjang (Kita simpan info UI-nya juga)
interface CartItem {
  id: string; // Book ID
  title: string;
  price: number;
  quantity: number;
}

// Tipe untuk nilai yang disediakan Context
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (book: { id: string; title: string; price: number }, quantity: number) => void;
  removeFromCart: (bookId: string) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Fungsi untuk mengambil cart dari localStorage
const getInitialCart = (): CartItem[] => {
  const savedCart = localStorage.getItem('shoppingCart');
  return savedCart ? JSON.parse(savedCart) : [];
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(getInitialCart());

  // Simpan ke localStorage setiap kali cartItems berubah
  useEffect(() => {
    localStorage.setItem('shoppingCart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Fungsi untuk menambah item ke keranjang
  const addToCart = (book: { id: string; title: string; price: number }, quantity: number) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === book.id);
      
      if (existingItem) {
        // Jika item sudah ada, tambah quantity-nya
        return prevItems.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        // Jika item baru, tambahkan ke array
        return [...prevItems, { ...book, quantity }];
      }
    });
  };

  // Fungsi untuk menghapus item dari keranjang
  const removeFromCart = (bookId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== bookId));
  };

  // Fungsi untuk mengosongkan keranjang (setelah checkout)
  const clearCart = () => {
    setCartItems([]);
  };

  // Fungsi untuk menghitung total harga
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };
  
  // Fungsi untuk menghitung jumlah total item
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, getCartTotal, getTotalItems }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};