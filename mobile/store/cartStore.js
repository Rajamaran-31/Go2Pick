import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useCartStore = create((set, get) => ({
  items: [],
  shopName: '',
  shopId: null,

  initialize: async () => {
    try {
      const itemsStr = await AsyncStorage.getItem('cart_items');
      const shopName = await AsyncStorage.getItem('cart_shop_name');
      const shopId = await AsyncStorage.getItem('cart_shop_id');
      set({
        items: itemsStr ? JSON.parse(itemsStr) : [],
        shopName: shopName || '',
        shopId: shopId || null,
      });
    } catch (e) {}
  },

  addItem: async (cartItem) => {
    // cartItem from API usually has product_id, product_name, product_price, quantity, shop_id, shop_name, etc.
    const items = [...get().items];
    const existingIndex = items.findIndex(i => i.product_id === cartItem.product_id);
    
    if (existingIndex > -1) {
      items[existingIndex].quantity += cartItem.quantity || 1;
    } else {
      items.push({
        id: cartItem.id || cartItem._id,
        product_id: cartItem.product_id,
        product_name: cartItem.product_name,
        product_price: cartItem.product_price,
        quantity: cartItem.quantity || 1,
      });
    }

    const shopName = cartItem.shop_name || get().shopName;
    const shopId = cartItem.shop_id || get().shopId;

    try {
      await AsyncStorage.setItem('cart_items', JSON.stringify(items));
      await AsyncStorage.setItem('cart_shop_name', shopName);
      if (shopId) await AsyncStorage.setItem('cart_shop_id', shopId.toString());
      set({ items, shopName, shopId });
    } catch (e) {}
  },

  clearCart: async () => {
    try {
      await AsyncStorage.removeItem('cart_items');
      await AsyncStorage.removeItem('cart_shop_name');
      await AsyncStorage.removeItem('cart_shop_id');
      set({ items: [], shopName: '', shopId: null });
    } catch (e) {}
  },

  getTotal: () => {
    return get().items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
