import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';
import { getShopTimeDisplay } from '../../utils/timeFormat';

const defaultCategoryImages = {
  'Bakery': 'http://localhost:8000/static/bakery.jpg',
  'Electronics': 'http://localhost:8000/static/electronics.jpg',
  'Grocery': 'http://localhost:8000/static/grocery.jpg',
  'Groceries': 'http://localhost:8000/static/grocery.jpg',
  'Home': 'http://localhost:8000/static/home.jpg',
  'Pharmacy': 'http://localhost:8000/static/pharmacy.jpg',
  'Ready to Eat': 'http://localhost:8000/static/ready_to_eat.jpg'
};

export default function SearchExplore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [trendingShops, setTrendingShops] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/api/shops/featured').then(res => {
      const data = res.data;
      const shops = Array.isArray(data) ? data : (data.shops || []);
      setTrendingShops(shops);
    }).catch(err => console.error("API Error:", err));

    api.get('/api/categories/').then(res => {
      const data = res.data;
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    }).catch(err => console.error("API Error:", err));
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      api.get(`/api/products`, { params: { search: searchTerm } })
        .then(res => {
          const data = res.data;
          const items = Array.isArray(data) ? data : (data.products || data.data || []);
          setProducts(items);
        })
        .catch(err => console.error(err));
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <>
      
{/* Top Navigation Bar */}
<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm">
<div className="flex justify-between items-center px-lg h-14 w-full">
<div className="flex items-center gap-base">
<span className="material-symbols-outlined text-trust-blue cursor-pointer" data-icon="arrow_back" onClick={() => navigate(-1)}>arrow_back</span>
<h1 className="font-display-lg text-[24px] font-bold text-trust-blue leading-none">Go2Pick</h1>
</div>
<div className="flex items-center gap-md">
<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-surface-container">
<img alt="User Profile" data-alt="A professional and friendly close-up portrait of a young adult with a warm smile, set against a soft-focus urban park background. The lighting is bright and natural, reflecting a clean and modern lifestyle. The color palette is composed of soft blues, greens, and crisp whites to match a high-trust corporate design aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9tIqLMYW7l-TwqFl-Kh2IkJZSTUSnoGe8Jz7YCUR2o1j5qI_QA5ejdFqMY7lyjS32NewLLUR34UpR3CDW-g8HtGZLITZvZVLuGDn2OyfulCH1rex4gUzrBdNlbKkYvFS6CnXtx6ODkXWhgzlDTLkHyHehT6DzpAFvkvk-yOzC7z94iWP5KJHSAvhOU_E5SitgOSKeqo3pSGXRpxq75TjKGRU8ZKTtcd3es9hHqWp3Bj0-P8Dx7xxlmL3xuqXLy93RtUmX2FRemdgR"/>
</div>
</div>
</div>
</header>
<main className="pt-20 pb-24 px-md md:px-lg max-w-container-max mx-auto">
{/* Search Section */}
<section className="mb-lg">
<div className="relative group">
<div className="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
<span className="material-symbols-outlined text-outline" data-icon="search">search</span>
</div>
<input className="w-full h-12 pl-12 pr-12 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-trust-blue font-body-lg text-body-lg transition-all shadow-sm" placeholder="Search for bread, coffee, or local shops..." type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>
<div className="absolute inset-y-0 right-0 pr-md flex items-center">
<button className="p-base hover:bg-surface-container-high rounded-full transition-colors active:scale-95">
<span className="material-symbols-outlined text-trust-blue" data-icon="mic">mic</span>
</button>
</div>
</div>
</section>
{/* Categories Bento Grid */}
<section className="mb-xl">
<div className="flex items-center justify-between mb-md">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Categories</h2>
<button onClick={() => navigate('/categories')} className="text-trust-blue font-label-sm uppercase tracking-wider hover:underline">View All</button>
</div>
<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-md">
{categories.map(category => {
  const imageUrl = category.image || defaultCategoryImages[category.name] || defaultCategoryImages['Grocery'];
  return (
    <div key={category.id} onClick={() => navigate(`/category/${encodeURIComponent(category.name)}`)} className="flex flex-col items-center gap-xs cursor-pointer group bg-surface-container-low p-md rounded-2xl border border-border-gray hover:shadow-md transition-all active:scale-95">
      <div className="h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden flex items-center justify-center bg-surface-container-high transition-colors shadow-sm">
        <img 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
          src={imageUrl} 
          alt={category.name}
          onError={(e) => {
            e.target.src = defaultCategoryImages[category.name] || defaultCategoryImages['Grocery'];
          }}
        />
      </div>
      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold mt-1 text-center">{category.name}</span>
    </div>
  );
})}
</div>
</section>
{/* Trending Shops Carousel */}
<section className="mb-xl overflow-hidden -mx-md md:mx-0 px-md md:px-0">
<div className="flex items-center justify-between mb-md">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Trending Shops</h2>
</div>
<div className="flex gap-md overflow-x-auto no-scrollbar pb-base">
{trendingShops.length === 0 ? (
  <p className="text-on-surface-variant font-body-md py-4">No trending shops yet.</p>
) : trendingShops.map(shop => (
  <div key={shop.id} onClick={() => navigate(`/shop-details?id=${shop.id}`)} className="min-w-[280px] bg-surface rounded-2xl shadow-sm border border-border-gray overflow-hidden group cursor-pointer">
    <div className="h-32 overflow-hidden relative">
      <img alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={shop.coverImageUrl || shop.imageUrl || shop.image || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=500&auto=format&fit=crop&q=60'}/>
      <div className="absolute top-2 right-2 bg-surface/90 backdrop-blur-md px-base rounded-lg flex items-center">
        <span className="material-symbols-outlined text-warning-amber text-sm mr-1" style={{'fontVariationSettings': "'FILL' 1"}}>star</span>
        <span className="font-label-sm">{shop.rating ? parseFloat(shop.rating).toFixed(1) : '—'}</span>
      </div>
    </div>
    <div className="p-md">
      <h3 className="font-title-md text-on-surface">{shop.name}</h3>
      <p className="font-body-md text-on-surface-variant mb-xs">{shop.category || shop.description}</p>
      <div className="flex items-center gap-xs text-success-green">
        <span className="material-symbols-outlined text-[16px]">schedule</span>
        <span className="font-label-sm text-label-sm">{getShopTimeDisplay(shop.opening_time, shop.closing_time, shop.isActive ?? shop.is_active)}</span>
      </div>
    </div>
  </div>
))}
</div>
</section>
{/* Recommended for You List */}
<section className="mb-lg">
<h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-md">Recommended for You</h2>
<div className="space-y-md">
{products.map((product) => (
<div className="flex bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-border-gray p-xs gap-md group cursor-pointer" onClick={() => navigate(`/product/${product.id || product._id}`)} key={product.id || product._id}>
<div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/product/${product.id || product._id}`)}>
<img alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={product.image || "https://lh3.googleusercontent.com/aida-public/AB6AXuC_YOM1erOnuPQ9W2j3Mz329bZNWzbuse9Z-1j12bwtkopphgAwAGGT0iNFISkiPLgPrLc3rqY5HdhxUNlXImmbtEHlYBn9MrJ9Ctb-pMSNyQa7zzEksD2ysx7pHJEXZAKuo8nUbeokszmzNeCXJNyJdFw6kRtYcu_ljLzLIpRyHk4h5wsoQFK9UeLof9hfiV1gKX5W6cmhVnW7ZLBNsmlJ8zOkstyaDeQwhhc4A9AH7Ao3U5qbfxb7TAwhgU1c71pBD9zyGY9e-7Ni"}/>
</div>
<div className="flex flex-col justify-between py-xs pr-xs flex-grow cursor-pointer" onClick={() => navigate(`/product/${product.id || product._id}`)}>
<div className="flex justify-between items-start">
<div>
<h4 className="font-title-md text-on-surface leading-tight">{product.name || 'Product'}</h4>
</div>
<span className="font-title-md text-trust-blue">₹{product.price || '0.00'} / {product.unit || 'pc'}</span>
</div>
<div className="flex justify-end">
<button className="bg-primary text-on-primary rounded-lg px-md py-1 font-label-sm active:scale-95 transition-transform flex items-center gap-1" onClick={(e) => { e.stopPropagation(); addToCart({ ...product, id: product.id || product._id }); }}>
<span className="material-symbols-outlined text-sm" data-icon="add">add</span>
                                Add
                            </button>
</div>
</div>
</div>
))}
</div>
</section>
</main>
{/* Bottom Navigation Bar */}



    </>
  );
}
