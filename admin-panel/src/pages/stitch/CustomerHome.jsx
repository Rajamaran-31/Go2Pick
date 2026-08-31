import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import api, { categoriesAPI, API_BASE, getImageUrl } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
      // Midnight crossover
      return currentTotalMins >= openMins || currentTotalMins < closeMins;
    }
  } catch (e) {
    console.error("Error determining shop status: ", e);
    return true;
  }
}

export default function CustomerHome() {
  const navigate = useNavigate();
  const { unreadCount } = useAppContext();
  const { user, setUser, refreshUser } = useAuth();

  const [categories, setCategories] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  // Live Geolocation states
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('loading'); // 'loading', 'granted', 'denied', 'unavailable'

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  // Filter States
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    openNow: false,
    distance: 'all',
    rating: 'any',
    categories: [],
    sortBy: 'nearest'
  });

  const [tempFilters, setTempFilters] = useState({ ...appliedFilters });

  // Refresh user details on load
  useEffect(() => {
    refreshUser();
  }, []);

  // Request & Watch GPS Location
  const requestGPSLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus('granted');
      },
      (error) => {
        console.warn("GPS Location access denied:", error.message);
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    let watchId = null;
    if (navigator.geolocation) {
      // Try getting initial position immediately
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationStatus('granted');
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setLocationStatus('denied');
          } else {
            setLocationStatus('unavailable');
          }
        }
      );

      // Setup watch for continuous live updates
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationStatus('granted');
        },
        (error) => {
          console.warn("GPS watch position error:", error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocationStatus('unavailable');
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Fetch shops and categories from Firebase
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [catRes, shopRes] = await Promise.all([
          categoriesAPI.listCategories().then(res => res.data),
          api.get('/api/shops', { params: { limit: 100 } }).then(res => res.data)
        ]);

        if (Array.isArray(catRes)) {
          setCategories(catRes.map(c => ({ id: c.id, name: c.name, image: c.image })));
        }

        if (Array.isArray(shopRes)) {
          // 8. Add debug log
          console.log("REAL SHOPS FROM API:", shopRes);
          setAllShops(shopRes);
        }
      } catch (error) {
        console.error('Error fetching home page data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Debounced search for products when searchQuery is entered
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedProducts([]);
      return;
    }

    setIsSearchingProducts(true);
    const delayDebounceFn = setTimeout(() => {
      api.get(`/api/products`, { params: { search: searchQuery } })
        .then(res => {
          const items = Array.isArray(res.data) ? res.data : (res.data.products || []);
          setSearchedProducts(items);
        })
        .catch(err => console.error("Error searching products:", err))
        .finally(() => setIsSearchingProducts(false));
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const customerFirstName = user?.fullName ? user.fullName.split(' ')[0] : 'there';

  // Process Shops Data (add calculated distance and open status)
  const processedShops = allShops.map(shop => {
    const open = isShopOpen(shop.opening_time, shop.closing_time, shop.isActive ?? shop.is_active);
    
    // Distances calculation based on shop's real stored lat/lng
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

  // Base list of approved shops
  let approvedShops = [...processedShops].filter(shop => 
    (shop.status === 'active' || shop.status === undefined) && 
    (shop.isActive !== false && shop.is_active !== false) && 
    (shop.isApproved !== false)
  );

  // Apply Common Filters (Open Now, Rating, Category) to both sections
  // 1. Open Now
  if (appliedFilters.openNow) {
    approvedShops = approvedShops.filter(shop => shop.isOpenStatus);
  }
  // 2. Rating
  if (appliedFilters.rating === '4') {
    approvedShops = approvedShops.filter(shop => parseFloat(shop.rating || 0) >= 4.0);
  } else if (appliedFilters.rating === '3') {
    approvedShops = approvedShops.filter(shop => parseFloat(shop.rating || 0) >= 3.0);
  }
  // 3. Category Multi-select
  if (appliedFilters.categories.length > 0) {
    approvedShops = approvedShops.filter(shop =>
      appliedFilters.categories.some(catName =>
        shop.category.toLowerCase().includes(catName.toLowerCase())
      )
    );
  }

  // Sort Function helper based on appliedFilters.sortBy
  const sortShops = (list) => {
    return list.sort((a, b) => {
      if (locationStatus === 'granted' && userCoords) {
        if (appliedFilters.sortBy === 'nearest') {
          return (a.distance ?? 999) - (b.distance ?? 999);
        } else if (appliedFilters.sortBy === 'rating') {
          const ratingA = parseFloat(a.rating) || 0;
          const ratingB = parseFloat(b.rating) || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          const reviewsA = a.total_reviews || a.ratingCount || 0;
          const reviewsB = b.total_reviews || b.ratingCount || 0;
          return reviewsB - reviewsA;
        } else if (appliedFilters.sortBy === 'newest') {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        } else if (appliedFilters.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
      } else {
        // Fallback: Until location is available, sort alphabetically
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  };

  // Divide into Nearby vs Other
  let nearbyShops = [];
  let otherShops = [];

  if (locationStatus === 'granted' && userCoords) {
    if (appliedFilters.distance === 'all') {
      nearbyShops = sortShops([...approvedShops]);
      otherShops = [];
    } else {
      const radius = parseFloat(appliedFilters.distance);
      nearbyShops = sortShops(approvedShops.filter(shop => shop.distance !== null && shop.distance <= radius));
      otherShops = sortShops(approvedShops.filter(shop => shop.distance !== null && shop.distance > radius));
    }
  } else {
    // If permission is denied or loading, sort alphabetically
    nearbyShops = sortShops([...approvedShops]);
    otherShops = [];
  }

  // Calculate active filter count (deviation from defaults: openNow=true, distance=all, rating=any, categories=[], sortBy=nearest)
  let activeFilterCount = 0;
  if (!appliedFilters.openNow) activeFilterCount++;
  if (appliedFilters.distance !== 'all') activeFilterCount++;
  if (appliedFilters.rating !== 'any') activeFilterCount++;
  if (appliedFilters.categories.length > 0) activeFilterCount++;
  if (appliedFilters.sortBy !== 'nearest') activeFilterCount++;

  // Modal handlers
  const handleOpenFilters = () => {
    setTempFilters({ ...appliedFilters });
    setIsFilterOpen(true);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...tempFilters });
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    const defaults = {
      openNow: true,
      distance: 'all',
      rating: 'any',
      categories: [],
      sortBy: 'nearest'
    };
    setTempFilters({ ...defaults });
    setAppliedFilters({ ...defaults });
    setIsFilterOpen(false);
  };

  // Category multi-select toggle
  const toggleCategorySelection = (catName) => {
    setTempFilters(prev => {
      const isSelected = prev.categories.includes(catName);
      const newCats = isSelected 
        ? prev.categories.filter(c => c !== catName)
        : [...prev.categories, catName];
      return { ...prev, categories: newCats };
    });
  };

  // Client-side search filters
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShops = processedShops.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasSearchResults = filteredCategories.length > 0 || filteredShops.length > 0 || searchedProducts.length > 0;

  return (
    <>
      <div className="py-8 px-6 max-w-7xl mx-auto min-h-screen">
        
        {/* Welcome message */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hello, {customerFirstName}!</h1>
          <p className="text-slate-500 font-medium mt-1">Discover your favorite local stores for quick pickups</p>
        </div>

        {/* 3. SEARCH BAR SECTION */}
        <section className="mb-8">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-10 py-3.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-trust-blue rounded-2xl focus:outline-none focus:ring-2 focus:ring-trust-blue/20 transition-all font-medium text-slate-700 shadow-sm placeholder-slate-400"
              placeholder="Search shops, products or categories..." 
              type="text"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>
        </section>

        {/* Location Error Warning Banner */}
        {locationStatus === 'denied' && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-5 py-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-2xl">location_off</span>
              <div>
                <p className="font-bold text-sm">Enable location to discover nearby shops.</p>
                <p className="text-xs text-amber-700/80 font-medium">To see real-time distance and find stores closest to you, please share your GPS location.</p>
              </div>
            </div>
            <button 
              onClick={requestGPSLocation}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex-shrink-0"
            >
              Use Current Location
            </button>
          </div>
        )}

        {/* -------------------- SEARCH RESULTS RENDER -------------------- */}
        {searchQuery ? (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-xl font-bold text-slate-800">Search Results for "{searchQuery}"</h2>
              <button onClick={() => setSearchQuery('')} className="text-sm font-semibold text-trust-blue hover:underline">Clear Search</button>
            </div>

            {!hasSearchResults && !isSearchingProducts ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                <p className="text-slate-500 font-semibold mt-2">No matching shops, products, or categories found.</p>
              </div>
            ) : (
              <>
                {/* Matching Categories */}
                {filteredCategories.length > 0 && (
                  <section>
                    <h3 className="text-md font-bold text-slate-500 uppercase tracking-wider mb-3">Matching Categories</h3>
                    <div className="flex flex-wrap gap-4">
                      {filteredCategories.map(cat => (
                        <div 
                          key={cat.id} 
                          onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
                          className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-full cursor-pointer hover:border-trust-blue hover:shadow-sm transition-all"
                        >
                          <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-100">
                            <img className="h-full w-full object-cover" src={cat.image || getFallbackImage(cat.name)} alt={cat.name} />
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Matching Shops */}
                {filteredShops.length > 0 && (
                  <section>
                    <h3 className="text-md font-bold text-slate-500 uppercase tracking-wider mb-3">Matching Shops</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredShops.map(shop => (
                        <div 
                          key={shop.id} 
                          onClick={() => navigate(`/shop-details?id=${shop.id}`)}
                          className="flex items-center gap-4 bg-white border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-trust-blue hover:shadow-md transition-all"
                        >
                          <div className="h-16 w-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            <img 
                              className="h-full w-full object-cover" 
                              src={getImageUrl(shop.coverImageUrl || shop.image || shop.imageUrl, getFallbackImage(shop.category))} 
                              alt={shop.name} 
                              onError={(e) => { e.target.onerror = null; e.target.src = getFallbackImage(shop.category); }}
                            />
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-800 truncate">{shop.name}</h4>
                            <p className="text-xs text-slate-400 font-semibold">{shop.category}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                                <span className="material-symbols-outlined text-xs fill-current">star</span>
                                {parseFloat(shop.rating || 0).toFixed(1)}
                              </span>
                              <span className="text-slate-300 text-xs">•</span>
                              <span className="text-xs text-slate-500 font-semibold">{shop.isOpenStatus ? 'Open' : 'Closed'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Matching Products */}
                {searchedProducts.length > 0 && (
                  <section>
                    <h3 className="text-md font-bold text-slate-500 uppercase tracking-wider mb-3">Matching Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchedProducts.map(product => (
                        <div 
                          key={product.id || product._id}
                          onClick={() => navigate(`/shop-details?id=${product.shopId || product.shop_id}&productId=${product.id || product._id}`)}
                          className="flex items-center gap-4 bg-white border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-trust-blue hover:shadow-md transition-all"
                        >
                          <div className="h-14 w-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            <img 
                              className="h-full w-full object-cover" 
                              src={product.image || 'https://placehold.co/100x100?text=Product'} 
                              alt={product.name} 
                            />
                          </div>
                          <div className="flex-grow overflow-hidden">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
                            <p className="text-xs text-slate-400 font-semibold truncate">From: {product.shop_name || 'Local Shop'}</p>
                            <span className="text-sm font-extrabold text-trust-blue mt-0.5 block">₹{parseFloat(product.price || 0).toFixed(2)} / {product.unit || 'pc'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {isSearchingProducts && (
                  <div className="text-center py-4">
                    <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-trust-blue rounded-full animate-spin"></div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* -------------------- NORMAL FLOW -------------------- */
          <div className="space-y-12">
            
            {/* 4. CATEGORIES SECTION */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">Categories</h2>
                
                {/* Categories filter button */}
                <button 
                  onClick={handleOpenFilters}
                  className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 hover:border-trust-blue text-slate-700 hover:text-trust-blue px-3 py-1.5 rounded-full font-bold text-xs transition-all shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                </button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2 md:flex-wrap md:overflow-visible">
                {isLoading ? (
                  // Categories Skeleton
                  Array(6).fill(0).map((_, idx) => (
                    <div key={idx} className="flex-shrink-0 flex flex-col items-center gap-2 w-16">
                      <div className="h-14 w-14 rounded-full bg-slate-100 animate-pulse" />
                      <div className="h-3 w-10 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))
                ) : (
                  <>
                    {categories.map(category => {
                      const imageUrl = category.image || getFallbackImage(category.name);
                      return (
                        <div 
                          key={category.id} 
                          onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)} 
                          className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group text-center"
                        >
                          <div className="h-14 w-14 md:h-16 md:w-16 rounded-full overflow-hidden flex items-center justify-center bg-slate-100 group-hover:bg-slate-200 transition-colors shadow-sm ring-2 ring-slate-100 ring-offset-2 group-hover:ring-trust-blue/40">
                            <img 
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              src={imageUrl} 
                              alt={category.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = getFallbackImage(category.name);
                              }}
                            />
                          </div>
                          <span className="font-semibold text-xs text-slate-600 group-hover:text-trust-blue transition-colors mt-1">{category.name}</span>
                        </div>
                      );
                    })}
                    
                    {/* View All Categories */}
                    <div 
                      onClick={() => navigate('/categories')} 
                      className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer group text-center"
                    >
                      <div className="h-14 w-14 md:h-16 md:w-16 rounded-full flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 group-hover:border-trust-blue group-hover:bg-trust-blue/5 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-trust-blue transition-colors text-2xl">arrow_forward</span>
                      </div>
                      <span className="font-semibold text-xs text-slate-500 group-hover:text-trust-blue transition-colors mt-1">View All</span>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* If location is unavailable or denied, show a single alphabetical list of all shops */}
            {locationStatus !== 'granted' ? (
              <section className="animate-fade-in">
                <div className="mb-6 flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">All Shops</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Showing all approved shops in alphabetical order</p>
                  </div>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, idx) => (
                      <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-64 animate-pulse">
                        <div className="h-36 bg-slate-100 w-full" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-slate-100 rounded w-2/3" />
                          <div className="h-3 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : nearbyShops.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <span className="material-symbols-outlined text-4xl text-slate-300">storefront</span>
                    <p className="text-slate-500 font-semibold mt-2">No shops available yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {nearbyShops.map(shop => {
                      const fallbackImg = getFallbackImage(shop.category);
                      return (
                        <div 
                          key={shop.id} 
                          onClick={() => navigate(`/shop-details?id=${shop.id}`)} 
                          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-150 hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative group flex flex-col h-full"
                        >
                          <div className="h-36 w-full overflow-hidden relative bg-slate-100">
                            <img 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              src={getImageUrl(shop.coverImageUrl || shop.image || shop.imageUrl, fallbackImg)} 
                              alt={shop.name}
                              loading="lazy"
                              onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                            />
                            <span className={`absolute top-3 right-3 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${shop.isOpenStatus ? 'bg-success-green/80' : 'bg-error-red/80'}`}>
                              {shop.isOpenStatus ? 'Open' : 'Closed'}
                            </span>
                          </div>

                          <div className="p-4 flex flex-col flex-grow relative pt-6">
                            <div className="absolute -top-6 right-4 h-12 w-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                              <img 
                                className="h-full w-full object-cover" 
                                src={getImageUrl(shop.imageUrl || shop.image, fallbackImg)} 
                                alt="Logo"
                                loading="lazy"
                                onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                              />
                            </div>
                            <div className="pr-12">
                              <h3 className="font-bold text-slate-800 text-md leading-tight truncate group-hover:text-trust-blue transition-colors">{shop.name}</h3>
                              <span className="text-xs text-slate-400 font-semibold">{shop.category}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2.5">
                              <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                                <span className="material-symbols-outlined text-sm fill-current">star</span>
                                {parseFloat(shop.rating || 0).toFixed(1)}
                              </span>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-xs text-slate-500 font-semibold">({shop.total_reviews || shop.ratingCount || 0} reviews)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-xs font-medium">
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
            ) : (
              <>
                {/* 5. NEARBY SHOPS SECTION */}
                <section className="animate-fade-in">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Nearby Shops</h2>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      {appliedFilters.distance === 'all' 
                        ? 'All shops sorted by nearest distance' 
                        : `Shops within ${appliedFilters.distance} km of your current location`}
                    </p>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array(3).fill(0).map((_, idx) => (
                        <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm h-64 animate-pulse">
                          <div className="h-36 bg-slate-100 w-full" />
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-slate-100 rounded w-2/3" />
                            <div className="h-3 bg-slate-100 rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : nearbyShops.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <span className="material-symbols-outlined text-4xl text-slate-300">location_searching</span>
                      <p className="text-slate-500 font-semibold mt-2">No shops available yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {nearbyShops.map(shop => {
                        const fallbackImg = getFallbackImage(shop.category);
                        return (
                          <div 
                            key={shop.id} 
                            onClick={() => navigate(`/shop-details?id=${shop.id}`)} 
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-150 hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative group flex flex-col h-full"
                          >
                            <div className="h-36 w-full overflow-hidden relative bg-slate-100">
                              <img 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                src={getImageUrl(shop.coverImageUrl || shop.image || shop.imageUrl, fallbackImg)} 
                                alt={shop.name}
                                loading="lazy"
                                onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                              />
                              {shop.distance !== null && (
                                <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                  {shop.distance < 1 
                                    ? `${Math.round(shop.distance * 1000)} m` 
                                    : `${shop.distance.toFixed(1)} km`}
                                </span>
                              )}
                              <span className={`absolute top-3 right-3 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${shop.isOpenStatus ? 'bg-success-green/80' : 'bg-error-red/80'}`}>
                                {shop.isOpenStatus ? 'Open' : 'Closed'}
                              </span>
                            </div>

                            <div className="p-4 flex flex-col flex-grow relative pt-6">
                              <div className="absolute -top-6 right-4 h-12 w-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                                <img 
                                  className="h-full w-full object-cover" 
                                  src={getImageUrl(shop.imageUrl || shop.image, fallbackImg)} 
                                  alt="Logo"
                                  loading="lazy"
                                  onError={(e) => { e.target.onerror = null; e.target.src = fallbackImg; }}
                                />
                              </div>

                              <div className="pr-12">
                                <h3 className="font-bold text-slate-800 text-md leading-tight truncate group-hover:text-trust-blue transition-colors">{shop.name}</h3>
                                <span className="text-xs text-slate-400 font-semibold">{shop.category}</span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-2.5">
                                <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                                  <span className="material-symbols-outlined text-sm fill-current">star</span>
                                  {parseFloat(shop.rating || 0).toFixed(1)}
                                </span>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <span className="text-xs text-slate-500 font-semibold">({shop.total_reviews || shop.ratingCount || 0} reviews)</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-xs font-medium">
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

                {/* OTHER SHOPS SECTION */}
                {appliedFilters.distance !== 'all' && otherShops.length > 0 && (
                  <section className="animate-fade-in">
                    <div className="mb-4">
                      <h2 className="text-xl font-bold text-slate-900">Other Shops</h2>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Remaining shops outside {appliedFilters.distance} km</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {otherShops.map(shop => {
                        const fallbackImg = getFallbackImage(shop.category);
                        return (
                          <div 
                            key={shop.id} 
                            onClick={() => navigate(`/shop-details?id=${shop.id}`)} 
                            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-150 hover:shadow-md hover:border-slate-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative group flex flex-col h-full opacity-85 hover:opacity-100"
                          >
                            <div className="h-36 w-full overflow-hidden relative bg-slate-100">
                              <img 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                src={shop.coverImageUrl || shop.image || fallbackImg} 
                                alt={shop.name}
                                loading="lazy"
                              />
                              {shop.distance !== null && (
                                <span className="absolute top-3 left-3 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                                  {shop.distance.toFixed(1)} km
                                </span>
                              )}
                              <span className={`absolute top-3 right-3 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm ${shop.isOpenStatus ? 'bg-success-green/80' : 'bg-error-red/80'}`}>
                                {shop.isOpenStatus ? 'Open' : 'Closed'}
                              </span>
                            </div>

                            <div className="p-4 flex flex-col flex-grow relative pt-6">
                              <div className="absolute -top-6 right-4 h-12 w-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white">
                                <img 
                                  className="h-full w-full object-cover" 
                                  src={shop.image || fallbackImg} 
                                  alt="Logo"
                                  loading="lazy"
                                />
                              </div>

                              <div className="pr-12">
                                <h3 className="font-bold text-slate-800 text-md leading-tight truncate group-hover:text-trust-blue transition-colors">{shop.name}</h3>
                                <span className="text-xs text-slate-400 font-semibold">{shop.category}</span>
                              </div>

                              <div className="flex items-center gap-1.5 mt-2.5">
                                <span className="flex items-center text-amber-500 text-xs font-bold gap-0.5">
                                  <span className="material-symbols-outlined text-sm fill-current">star</span>
                                  {parseFloat(shop.rating || 0).toFixed(1)}
                                </span>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <span className="text-xs text-slate-500 font-semibold">({shop.total_reviews || shop.ratingCount || 0} reviews)</span>
                              </div>

                              <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-xs font-medium">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                <span>{shop.timeDisplay}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}
      </div>

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

                {/* 5. Multi-select Categories */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50">
                    {categories.map(cat => {
                      const isSelected = tempFilters.categories.includes(cat.name);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategorySelection(cat.name)}
                          className={`py-1 px-2.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'bg-[#f97316] border-[#f97316] text-white' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-350'}`}
                        >
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={handleClearFilters}
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
