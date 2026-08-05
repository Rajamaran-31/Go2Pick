import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/api/cart/');
      setCartItems(res.data?.items || []);
    } catch (err) {
      console.error("Cart fetch error", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (product, quantity = 1) => {
    try {
      const res = await api.post('/api/cart/', { product_id: product.id, quantity });
      if (res.status === 201 || res.status === 200) {
        fetchCart();
        alert('Added to cart!');
      }
    } catch (err) {
      console.error("Cart add error", err);
      const detail = err.response?.data?.detail || "";
      if (err.response?.status === 400 && detail.includes("Clear your cart first")) {
        if (window.confirm("You can only order from one shop at a time. Do you want to clear your current cart to order from this shop instead?")) {
          await clearCart();
          // Try adding again after clearing
          try {
            const retryRes = await api.post('/api/cart/', { product_id: product.id, quantity });
            if (retryRes.status === 201 || retryRes.status === 200) {
              fetchCart();
              alert('Added to cart!');
            }
          } catch (retryErr) {
            console.error("Cart add retry error", retryErr);
            alert(retryErr.response?.data?.detail || "Failed to add to cart after clearing");
          }
        }
      } else {
        alert(detail || "Failed to add to cart");
      }
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const res = await api.delete(`/api/cart/${itemId}`);
      if (res.status === 200) fetchCart();
    } catch (err) {
      console.error("Cart remove error", err);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(itemId);
    }
    try {
      const res = await api.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      if (res.status === 200) fetchCart();
    } catch (err) {
      console.error("Cart update error", err);
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.delete('/api/cart/clear/all');
      if (res.status === 200) setCartItems([]);
    } catch (err) {
      console.error("Cart clear error", err);
    }
  };

  const cartTotal = cartItems.reduce((total, item) => total + ((item.product_price || 0) * item.quantity), 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
