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
    const prodId = product.id || product._id || product.product_id;
    const prodPrice = parseFloat(product.price || product.productPrice || product.product_price || 0);
    const prodName = product.name || product.productName || product.product_name || 'Product';
    const prodImage = product.image || product.imageUrl || product.productImage || product.product_image || '';
    const prodUnit = product.unit || product.productUnit || product.product_unit || 'pc';
    const shopId = product.shopId || product.shop_id || '';
    const shopName = product.shopName || product.shop_name || '';

    const previousItems = [...cartItems];

    // Optimistic Update: Update state IMMEDIATELY for instant UI response (0ms lag)
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => (item.id || item.productId || item.product_id) === prodId);
      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + quantity;
        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotal: newQty * (item.product_price || item.productPrice || prodPrice)
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: prodId,
            productId: prodId,
            product_id: prodId,
            productName: prodName,
            product_name: prodName,
            productPrice: prodPrice,
            product_price: prodPrice,
            productImage: prodImage,
            product_image: prodImage,
            productUnit: prodUnit,
            product_unit: prodUnit,
            shopId,
            shop_id: shopId,
            shopName,
            shop_name: shopName,
            quantity,
            subtotal: prodPrice * quantity
          }
        ];
      }
    });

    try {
      const res = await api.post('/api/cart/', { product_id: prodId, quantity });
      if (res.data?.items) {
        setCartItems(res.data.items);
      } else {
        fetchCart();
      }
    } catch (err) {
      console.error("Cart add error", err);
      // Revert optimistic update if API fails
      setCartItems(previousItems);

      const detail = err.response?.data?.detail || "";
      if (err.response?.status === 400 && detail.includes("Clear your cart first")) {
        if (window.confirm("You can only order from one shop at a time. Do you want to clear your current cart to order from this shop instead?")) {
          await clearCart();
          try {
            const retryRes = await api.post('/api/cart/', { product_id: prodId, quantity });
            if (retryRes.data?.items) {
              setCartItems(retryRes.data.items);
            } else {
              fetchCart();
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
    const previousItems = [...cartItems];
    setCartItems(prev => prev.filter(item => (item.id || item.productId || item.product_id) !== itemId));

    try {
      const res = await api.delete(`/api/cart/${itemId}`);
      if (res.status === 200) {
        if (res.data?.items) setCartItems(res.data.items);
      } else {
        fetchCart();
      }
    } catch (err) {
      console.error("Cart remove error", err);
      setCartItems(previousItems);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      return removeFromCart(itemId);
    }
    const previousItems = [...cartItems];
    setCartItems(prev => prev.map(item => {
      if ((item.id || item.productId || item.product_id) === itemId) {
        const pPrice = item.product_price || item.productPrice || 0;
        return {
          ...item,
          quantity: newQuantity,
          subtotal: newQuantity * pPrice
        };
      }
      return item;
    }));

    try {
      const res = await api.put(`/api/cart/${itemId}`, { quantity: newQuantity });
      if (res.status === 200) {
        if (res.data?.items) setCartItems(res.data.items);
      } else {
        fetchCart();
      }
    } catch (err) {
      console.error("Cart update error", err);
      setCartItems(previousItems);
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

  const cartTotal = cartItems.reduce((total, item) => total + ((item.product_price || item.productPrice || 0) * item.quantity), 0);
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
