import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api, { API_BASE } from '../../services/api';
import { getShopTimeDisplay } from '../../utils/timeFormat';

// Default images mapping
const defaultCategoryImages = {
  'Bakery': `${API_BASE}/static/bakery.jpg`,
  'Electronics': `${API_BASE}/static/electronics.jpg`,
  'Grocery': `${API_BASE}/static/grocery.jpg`,
  'Groceries': `${API_BASE}/static/grocery.jpg`,
  'Home': `${API_BASE}/static/home.jpg`,
  'Pharmacy': `${API_BASE}/static/pharmacy.jpg`,
  'Ready to Eat': `${API_BASE}/static/ready_to_eat.jpg`
};

const getFallbackImage = (category) => {
  return defaultCategoryImages[category] || defaultCategoryImages['Grocery'];
};

// Haversine formula to calculate real distance in km
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined ||
      lat1 === null || lon1 === null || lat2 === null || lon2 === null) {
    return null;
  }
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Determine if a shop is currently open based on IST time
function isShopOpen(openingTimeStr = '09:00', closingTimeStr = '21:00', isActive = true) {
  if (isActive === false) return false;
  const now = new Date();
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });
  
  try {
    const parts = formatter.formatToParts(now);
    let currentHour = 0;
    let currentMinute = 0;
    for (const part of parts) {
      if (part.type === 'hour') {
        currentHour = parseInt(part.value, 10);
        if (currentHour === 24) currentHour = 0;
      }
      if (part.type === 'minute') {
        currentMinute = parseInt(part.value, 10);
      }
    }

    const currentTotalMins = currentHour * 60 + currentMinute;

    const parseTime = (t) => {
      if (!t) return 0;
      const m = t.match(/(\d{1,2}):(\d{2})/);
      if (!m) return 0;
      return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    };

    const openMins = parseTime(openingTimeStr);
    const closeMins = parseTime(closingTimeStr);

    if (closeMins > openMins) {
      return currentTotalMins >= openMins && currentTotalMins < closeMins;
    } else {
      return currentTotalMins >= openMins || currentTotalMins < closeMins;
    }
  } catch (e) {
    console.error("Error determining shop status: ", e);
    return true;
  }
}

export default function CategoryListing() {
  const navigate = useNavigate();
  const { categoryName } = useParams();
  const { addToCart } = useCart();

  const [rawProducts, setRawProducts] = useState([]);
  const [rawShops, setRawShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // GPS user coordinates
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading');

  // Search input
  const [searchQuery, setSearchQuery] = useState('');

  // Active filters
  const [filters, setFilters] = useState({
    distance: 'all',
    rating: 'any',
    openNow: false,
    sortBy: 'nearest'
  });

  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationStatus('granted');
        },
        (error) => {
          console.warn("Location permission denied or unavailable:", error.message);
          setLocationStatus('denied');
          // Fallback to Bangalore center
          setUserCoords({ latitude: 12.9716, longitude: 77.5946 });
        }
      );
    } else {
      setLocationStatus('unavailable');
      setUserCoords({ latitude: 12.9716, longitude: 77.5946 });
    }
  }, []);

  // Fetch category shops and products from real backend
  useEffect(() => {
    setIsLoading(true);
    const fetchCategoryData = async () => {
      try {
        const [shopsRes, productsRes] = await Promise.all([
          api.get('/api/shops', { params: { category: categoryName, limit: 100 } }).then(res => res.data),
          api.get('/api/products', { params: { category: categoryName, limit: 200 } }).then(res => res.data)
        ]);

        setRawShops(Array.isArray(shopsRes) ? shopsRes : []);
        setRawProducts(Array.isArray(productsRes) ? productsRes : (productsRes.products || []));
      } catch (error) {
        console.error("Error fetching category data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryName) {
      fetchCategoryData();
    }
  }, [categoryName]);

  // Process Shops list (with distances and open statuses)
  const processedShops = rawShops.map(shop => {
    const open = isShopOpen(shop.opening_time, shop.closing_time, shop.isActive ?? shop.is_active);
    let distanceVal = null;
    if (userCoords && shop.latitude !== undefined && shop.longitude !== undefined) {
      distanceVal = calculateHaversineDistance(
        userCoords.latitude,
        userCoords.longitude,
        shop.latitude,
        shop.longitude
      );
    }
    return {
      ...shop,
      isOpenStatus: open,
      distance: distanceVal,
      timeDisplay: getShopTimeDisplay(shop.opening_time, shop.closing_time, shop.isActive ?? shop.is_active)
    };
  });

  // Apply filters to Shops list
  let filteredShops = processedShops.filter(shop => 
    (shop.status === 'active' || shop.status === undefined) && 
    (shop.isActive !== false && shop.is_active !== false) && 
    (shop.isApproved !== false)
  );

  // 1. Distance filter
  if (filters.distance !== 'all' && locationStatus === 'granted') {
    const maxDist = parseFloat(filters.distance);
    filteredShops = filteredShops.filter(shop => shop.distance !== null && shop.distance <= maxDist);
  }

  // 2. Rating filter
  if (filters.rating === '4') {
    filteredShops = filteredShops.filter(shop => parseFloat(shop.rating || 0) >= 4.0);
  } else if (filters.rating === '3') {
    filteredShops = filteredShops.filter(shop => parseFloat(shop.rating || 0) >= 3.0);
  }

  // 3. Open Now filter
  if (filters.openNow) {
    filteredShops = filteredShops.filter(shop => shop.isOpenStatus);
  }

  // 4. Search Query filter (matches shop name or category)
  if (searchQuery.trim()) {
    filteredShops = filteredShops.filter(shop => 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply Sorting to Shops
  filteredShops.sort((a, b) => {
    if (locationStatus === 'granted' && filters.sortBy === 'nearest') {
      return (a.distance ?? 999) - (b.distance ?? 999);
    } else if (filters.sortBy === 'rating') {
      const ratingA = parseFloat(a.rating) || 0;
      const ratingB = parseFloat(b.rating) || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      return (b.total_reviews || 0) - (a.total_reviews || 0);
    } else if (filters.sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    } else if (filters.sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    // Fallback sort: Alphabetical
    return a.name.localeCompare(b.name);
  });

  // Filter Products: Only display products belonging to the filtered/visible shops
  const filteredShopIds = new Set(filteredShops.map(s => s.id || s._id));
  
  let filteredProducts = rawProducts.filter(product => {
    const shopIdStr = String(product.shopId || product.shop_id || '');
    return filteredShopIds.has(shopIdStr);
  });

  // Search Query filter on products
  if (searchQuery.trim()) {
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Modal filters triggers
  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
    setIsFilterOpen(false);
  };

  const handleRemoveFilter = (filterKey) => {
    setFilters(prev => {
      const updated = { ...prev };
      if (filterKey === 'distance') updated.distance = 'all';
      if (filterKey === 'rating') updated.rating = 'any';
      if (filterKey === 'openNow') updated.openNow = false;
      if (filterKey === 'sortBy') updated.sortBy = 'nearest';
      return updated;
    });
    setTempFilters(prev => {
      const updated = { ...prev };
      if (filterKey === 'distance') updated.distance = 'all';
      if (filterKey === 'rating') updated.rating = 'any';
      if (filterKey === 'openNow') updated.openNow = false;
      if (filterKey === 'sortBy') updated.sortBy = 'nearest';
      return updated;
    });
  };

  // Get Shop Name mapping helper for products
  const getShopName = (shopId) => {
    const shop = rawShops.find(s => s.id === shopId || s._id === shopId);
    return shop ? shop.name : 'Local Shop';
  };

  // Dynamic Shop Count Header Text
  const getShopCountText = () => {
    if (isLoading) return 'Finding shops...';
    const count = filteredShops.length;
    if (count === 0) return 'No shops found near you';
    if (count === 1) return '1 shop offering items near you';
    return `${count} shops offering items near you`;
  };

  return (
    <>
      {/* AppBar Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              className="material-symbols-outlined text-slate-600 hover:text-trust-blue active:scale-90 transition-transform cursor-pointer" 
              onClick={() => navigate('/')}
            >
              arrow_back
            </button>
            <h1 className="text-xl font-extrabold tracking-tight text-trust-blue cursor-pointer" onClick={() => navigate('/')}>
              Go2Pick
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="material-symbols-outlined text-slate-600 hover:text-trust-blue relative p-1.5 hover:bg-slate-50 rounded-full cursor-pointer"
              onClick={() => navigate('/explore')}
            >
              search
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-slate-200 cursor-pointer" onClick={() => navigate('/profile')}>
              <img alt="User" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0a2cxlAd3XgffYKhoD4B6BnLlbMGkRW71EqZAARhJAGaqadZ_Zs-JSxW_71_1DxL0eYYXySawpinxIb7Cz4Qn6IDq02YDlSD6PlUVfZhKnEjY8Xhp3vTjkn0tIrG7Zb8B_gmTvS3n6NjOiS7jJaSMjzveJrpuoG6DyMKHItpE53YW1KEm4L7rvk05Q8cpkCw5dxkqduJdE5DgVqFG9pepsN7GJsEzSOfvKnlj5PTi2H01RzPXKXeIXqO2KQAEfWMN_gQEQNCFT06-"/>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        
        {/* Navigation Breadcrumb & Title */}
        <section className="mb-8">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-3">
            <Link className="hover:text-trust-blue transition-colors" to="/">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-600 font-bold">{categoryName}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{categoryName}</h2>
              <p className="text-slate-500 font-semibold mt-1">
                {getShopCountText()}
              </p>
            </div>
            
            {/* Search Input inside Category */}
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-trust-blue focus:bg-white rounded-xl outline-none font-semibold text-slate-700 text-sm shadow-sm transition-all focus:ring-2 focus:ring-trust-blue/20" 
                placeholder={`Search in ${categoryName}...`} 
                type="text"
              />
            </div>
          </div>
        </section>

        {/* Filter Chips Bar */}
        <section className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-3 mb-8">
          {/* Filters trigger button */}
          <button 
            onClick={() => {
              setTempFilters({ ...filters });
              setIsFilterOpen(true);
            }}
            className="flex items-center gap-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            Filters
          </button>

          {/* Active chips list */}
          {filters.distance !== 'all' && (
            <div className="flex items-center gap-1 px-3.5 py-1.5 bg-trust-blue/10 border border-trust-blue/20 hover:border-trust-blue/40 text-trust-blue rounded-full font-bold text-xs transition-colors flex-shrink-0">
              <span>Distance: Under {filters.distance}km</span>
              <button 
                onClick={() => handleRemoveFilter('distance')} 
                className="material-symbols-outlined text-[16px] leading-none hover:text-trust-blue/80 active:scale-90 transition-transform"
              >
                close
              </button>
            </div>
          )}

          {filters.rating !== 'any' && (
            <div className="flex items-center gap-1 px-3.5 py-1.5 bg-trust-blue/10 border border-trust-blue/20 hover:border-trust-blue/40 text-trust-blue rounded-full font-bold text-xs transition-colors flex-shrink-0">
              <span>Rating: {filters.rating === '4' ? '4.0+' : '3.0+'}★</span>
              <button 
                onClick={() => handleRemoveFilter('rating')} 
                className="material-symbols-outlined text-[16px] leading-none hover:text-trust-blue/80 active:scale-90 transition-transform"
              >
                close
              </button>
            </div>
          )}

          {filters.openNow && (
            <div className="flex items-center gap-1 px-3.5 py-1.5 bg-success-green/10 border border-success-green/20 hover:border-success-green/45 text-success-green rounded-full font-bold text-xs transition-colors flex-shrink-0">
              <span>Open Now</span>
              <button 
                onClick={() => handleRemoveFilter('openNow')} 
                className="material-symbols-outlined text-[16px] leading-none hover:text-success-green/80 active:scale-90 transition-transform"
              >
                close
              </button>
            </div>
          )}

          {filters.sortBy !== 'nearest' && (
            <div className="flex items-center gap-1 px-3.5 py-1.5 bg-trust-blue/10 border border-trust-blue/20 hover:border-trust-blue/40 text-trust-blue rounded-full font-bold text-xs transition-colors flex-shrink-0">
              <span>Sorted by: {
                filters.sortBy === 'rating' ? 'Highest Rated' :
                filters.sortBy === 'newest' ? 'Newest First' : 'A-Z'
              }</span>
              <button 
                onClick={() => handleRemoveFilter('sortBy')} 
                className="material-symbols-outlined text-[16px] leading-none hover:text-trust-blue/80 active:scale-90 transition-transform"
              >
                close
              </button>
            </div>
          )}
        </section>

        {/* 3. Top-Selling Delights Section */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-xl font-bold text-slate-800">Top-Selling Delights</h3>
          </div>
          {isLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {Array(4).fill(0).map((_, idx) => (
                <div key={idx} className="min-w-[180px] h-48 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
              <span className="material-symbols-outlined text-3xl text-slate-300">cookie</span>
              <p className="text-slate-500 font-semibold text-sm mt-1">No products found in this category.</p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {filteredProducts.map((product) => {
                const shopIdStr = product.shopId || product.shop_id;
                return (
                  <div 
                    className="min-w-[180px] max-w-[180px] group cursor-pointer bg-white border border-slate-150 rounded-2xl p-2.5 hover:shadow-md transition-shadow relative flex flex-col justify-between" 
                    key={product.id || product._id} 
                    onClick={() => navigate(`/product/${product.id || product._id}`)}
                  >
                    <div>
                      {/* Product Image */}
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 shadow-sm bg-slate-100">
                        <img 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          src={product.image || "https://placehold.co/200x200?text=Product"} 
                          alt={product.name}
                          loading="lazy"
                        />
                        {/* Add to Cart button */}
                        <button 
                          className="absolute bottom-2 right-2 w-9 h-9 bg-trust-blue text-white rounded-full flex items-center justify-center shadow-md hover:bg-trust-blue/90 active:scale-90 transition-transform cursor-pointer" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            addToCart({ ...product, id: product.id || product._id }); 
                          }}
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm truncate leading-tight group-hover:text-trust-blue transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold truncate mt-0.5">
                        {getShopName(shopIdStr)}
                      </p>
                    </div>
                    <p className="text-sm font-extrabold text-trust-blue mt-2">
                      ₹{parseFloat(product.price || 0).toFixed(2)} / {product.unit || 'pc'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. All Category Shops Section */}
        <section>
          <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-2">
            <h3 className="text-xl font-bold text-slate-800">All {categoryName} Shops</h3>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, idx) => (
                <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-64 animate-pulse" />
              ))}
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">storefront</span>
              <h4 className="font-bold text-slate-850">No {categoryName} shops found near you.</h4>
              <p className="text-slate-400 font-semibold text-xs mt-1 max-w-sm">
                Try widening your distance radius or updating your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map(shop => {
                const fallbackImg = getFallbackImage(shop.category);
                return (
                  <div 
                    key={shop.id || shop._id} 
                    onClick={() => navigate(`/shop-details?id=${shop.id || shop._id}`)} 
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-150 hover:border-slate-200 transition-all cursor-pointer group flex flex-col h-full"
                  >
                    {/* Cover image */}
                    <div className="relative h-44 w-full bg-slate-100">
                      <img 
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                        src={shop.image || fallbackImg} 
                        alt={shop.name}
                        loading="lazy"
                      />
                      {/* Rating indicator */}
                      <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-0.5 text-white shadow-sm">
                        <span className="material-symbols-outlined text-amber-400 text-xs fill-current">star</span>
                        <span className="text-xs font-bold">{parseFloat(shop.rating || 0).toFixed(1)}</span>
                      </div>
                      
                      {/* Distance Badge */}
                      {shop.distance !== null && (
                        <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                          {shop.distance < 1 
                            ? `${Math.round(shop.distance * 1000)} m` 
                            : `${shop.distance.toFixed(1)} km`}
                        </span>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-md truncate group-hover:text-trust-blue transition-colors leading-tight">
                            {shop.name}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${shop.isOpenStatus ? 'bg-success-green/10 text-success-green' : 'bg-error-red/10 text-error-red'}`}>
                            {shop.isOpenStatus ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">{shop.category}</span>
                        <p className="text-xs text-slate-500 font-medium mt-2 line-clamp-2">
                          {shop.description || 'Welcome to our pickup pre-order shop.'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-slate-500 mt-4 border-t border-slate-100 pt-3 text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>{shop.timeDisplay}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* -------------------- RESPONSIVE FILTER MODAL -------------------- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[9999] flex justify-center md:justify-end items-end md:items-stretch bg-slate-950/45 backdrop-blur-sm">
          {/* Overlay click back */}
          <div className="absolute inset-0" onClick={() => setIsFilterOpen(false)} />

          {/* Drawer container */}
          <div className="relative w-full md:w-[420px] max-h-[85vh] md:max-h-screen bg-white rounded-t-3xl md:rounded-t-none p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-slide-up z-10">
            <div>
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-800">Filters</h3>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>

              {/* Filters Form */}
              <div className="space-y-6">
                {/* 2. Distance Filter */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Distance Radius</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Distances' },
                      { value: '1', label: 'Within 1 km' },
                      { value: '3', label: 'Within 3 km' },
                      { value: '5', label: 'Within 5 km' },
                      { value: '10', label: 'Within 10 km' },
                      { value: '25', label: 'Within 25 km' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, distance: opt.value }))}
                        className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${tempFilters.distance === opt.value ? 'bg-trust-blue text-white border-trust-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Rating Filter */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rating</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'any', label: 'Any Rating' },
                      { value: '3', label: '3.0★ & Above' },
                      { value: '4', label: '4.0★ & Above' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, rating: opt.value }))}
                        className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${tempFilters.rating === opt.value ? 'bg-trust-blue text-white border-trust-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-350'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Sort By */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'nearest', label: 'Nearest Distance' },
                      { value: 'rating', label: 'Highest Rated' },
                      { value: 'newest', label: 'Newest First' },
                      { value: 'name', label: 'A-Z Shop Name' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTempFilters(prev => ({ ...prev, sortBy: opt.value }))}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${tempFilters.sortBy === opt.value ? 'bg-trust-blue text-white border-trust-blue' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-305'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  const defaults = {
                    openNow: true,
                    distance: 'all',
                    rating: 'any',
                    sortBy: 'nearest'
                  };
                  setTempFilters({ ...defaults });
                  setFilters({ ...defaults });
                  setIsFilterOpen(false);
                }}
                className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors border border-slate-200 hover:border-slate-300 rounded-xl"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="flex-1 py-3 text-sm font-bold bg-trust-blue text-white hover:opacity-90 rounded-xl shadow-md transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
