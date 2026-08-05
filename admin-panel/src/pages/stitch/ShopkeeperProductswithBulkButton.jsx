import { useAppContext } from '../../context/AppContext';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ShopkeeperProductswithBulkButton() {
  const { setIsShopkeeperMode } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const handleAlert = (msg) => window.alert(msg);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/shopkeeper/products');
      if (res.data && res.data.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error("Failed to fetch shopkeeper products:", err);
      setErrorMessage("Failed to load live products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await api.delete(`/api/shopkeeper/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
        window.alert("Product deleted successfully!");
      } catch (err) {
        console.error("Failed to delete product:", err);
        window.alert(err.response?.data?.detail || "Failed to delete product");
      }
    }
  };

  const handleStockChange = async (id, newStockValue) => {
    const newStock = Math.max(0, parseInt(newStockValue) || 0);
    setProducts(products.map(p => p.id === id ? { ...p, stock: newStock } : p));

    try {
      await api.put(`/api/shopkeeper/products/${id}`, { stock: newStock });
    } catch (err) {
      console.error("Failed to update stock:", err);
      fetchProducts();
    }
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', class: 'bg-error-red/10 text-error-red' };
    if (stock <= 5) return { label: `Only ${stock} left`, class: 'bg-warning-amber/10 text-warning-amber' };
    return { label: 'In Stock', class: 'bg-success-green/10 text-success-green' };
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm flex justify-between items-center h-16 px-md w-full">
        <div className="flex items-center gap-xs">
          <button className="material-symbols-outlined text-marketplace-orange mr-2" onClick={() => navigate('/shopkeeper')}>arrow_back</button>
          <span className="material-symbols-outlined text-marketplace-orange text-headline-lg-mobile" data-icon="storefront">storefront</span>
          <h1 className="font-title-md text-title-md text-on-surface">Products</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center w-8 h-8 bg-marketplace-orange text-white rounded-full hover:bg-marketplace-orange/90 transition-colors active:scale-95 transition-transform" onClick={() => navigate('/shopkeeper/edit-product')}>
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <button className="flex items-center gap-xs bg-marketplace-orange/10 text-marketplace-orange font-label-sm text-label-sm px-md py-xs rounded-full hover:bg-marketplace-orange/20 transition-colors active:scale-95 transition-transform" onClick={() => navigate('/shopkeeper/bulk-import')}>
            <span className="material-symbols-outlined text-[18px]" data-icon="table_chart">table_chart</span>
            Bulk Import
          </button>
          <button className="bg-surface-container-low text-marketplace-orange font-label-sm text-label-sm px-md py-xs rounded-full hover:bg-surface-container-high transition-colors active:scale-95 transition-transform hidden sm:block" onClick={() => { setIsShopkeeperMode(false); navigate('/'); }}>
            Switch to Customer
          </button>
        </div>
      </header>
      <main className="pt-20 pb-24 px-md max-w-screen-xl mx-auto">
        <section className="mb-lg">
          <div className="relative flex items-center gap-sm">
            <div className="relative flex-grow">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" data-icon="search">search</span>
              <input className="w-full pl-12 pr-4 py-3 bg-surface-container-lowest border border-border-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange transition-all font-body-md text-body-md" placeholder="Search products..." type="text"/>
            </div>
            <button className="flex items-center justify-center w-12 h-12 bg-surface-container-lowest border border-border-gray rounded-xl hover:bg-surface-container-low transition-colors active:scale-95" onClick={() => handleAlert("Filter Options")}>
              <span className="material-symbols-outlined text-on-surface-variant" data-icon="filter_list">filter_list</span>
            </button>
          </div>
        </section>

        {errorMessage && (
          <div className="bg-warning-amber/10 border border-warning-amber/20 text-warning-amber p-md rounded-xl mb-md font-body-md flex items-center gap-sm">
            <span className="material-symbols-outlined">warning</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marketplace-orange"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm min-h-[300px]">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md">inventory_2</span>
            <h3 className="font-title-lg text-on-surface font-bold">No products found</h3>
            <p className="text-on-surface-variant font-body-md max-w-sm mt-xs">
              Your shop doesn't have any products yet. Click the '+' button to add your first product.
            </p>
          </div>
        ) : (
          <div className="space-y-sm">
            {products.map(product => (
              <div key={product.id} className="bg-surface-container-lowest rounded-xl p-sm shadow-[0_4px_6px_-1px_rgb(0_0_0_/0.05)] flex items-center gap-md group hover:bg-surface-container-low transition-colors">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                  <img alt={product.name} className="w-full h-full object-cover" src={product.images?.[0] || 'https://placehold.co/150'} />
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-title-md text-body-lg text-on-surface truncate">{product.name}</h3>
                  <div className="flex items-center gap-xs mt-1">
                    <span className="font-bold text-marketplace-orange text-body-md">₹{parseFloat(product.price || 0).toFixed(2)} / {product.unit || 'pc'}</span>
                    <span className="text-outline text-[10px]">•</span>
                    <span className="text-on-surface-variant font-label-sm text-label-sm">{product.stock} in stock</span>
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm ${getStockStatus(product.stock).class}`}>
                      {getStockStatus(product.stock).label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-base">
                  <input 
                    type="number" 
                    min="0"
                    className="w-16 p-1 border border-border-gray rounded-md text-center focus:outline-none focus:ring-1 focus:ring-marketplace-orange font-label-sm mr-2" 
                    value={product.stock}
                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                    title="Update Stock"
                  />
                  <button className="p-2 text-on-surface-variant hover:text-marketplace-orange transition-colors" onClick={() => navigate('/shopkeeper/edit-product', { state: { product } })}>
                    <span className="material-symbols-outlined text-[20px]" data-icon="edit">edit</span>
                  </button>
                  <button className="p-2 text-on-surface-variant hover:text-error-red transition-colors" onClick={() => handleDelete(product.id)}>
                    <span className="material-symbols-outlined text-[20px]" data-icon="delete">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
