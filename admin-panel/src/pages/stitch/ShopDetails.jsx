import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatIndianTime } from '../../utils/timeFormat';

const defaultShopImage = "https://placehold.co/800x400?text=Shop+Cover";

export default function ShopDetails() {
  const navigate = useNavigate();
  const { addToCart, cartCount, cartTotal } = useCart();
  const { user, token } = useAuth();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const shopId = searchParams.get('id');

  const [shop, setShop] = useState(null);
  const [groupedProducts, setGroupedProducts] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingMessage, setRatingMessage] = useState("");
  const [reviews, setReviews] = useState([]);

  const fetchReviewsList = async () => {
    try {
      const res = await api.get('/api/reviews', { params: { shopId } });
      console.log("DEBUG [fetchReviewsList] GET /api/reviews response:", res.data);
      const list = res.data?.reviews || [];
      setReviews(list);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  React.useEffect(() => {
    if (!shopId) {
      setIsLoading(false);
      return;
    }
    const fetchShopAndProducts = async () => {
      try {
        const [sRes, pRes] = await Promise.all([
          api.get(`/api/shops/${shopId}`),
          api.get(`/api/products/`, { params: { shop_id: shopId } })
        ]);
        const shopData = sRes.data?.shop || sRes.data;
        console.log("DEBUG [ShopDetails] shop details API response:", sRes.data);
        console.log("DEBUG [ShopDetails] saved shop imageUrl:", shopData?.imageUrl);
        console.log("DEBUG [ShopDetails] saved coverImageUrl:", shopData?.coverImageUrl);
        setShop(shopData);
        const prodList = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.products || pRes.data?.data || []);
        if (prodList.length > 0) {
          const grouped = prodList.reduce((acc, product) => {
            const cat = product.category || 'Other';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(product);
            return acc;
          }, {});
          setGroupedProducts(grouped);
        }
      } catch (err) {
        console.error('Shop/products fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShopAndProducts();
    fetchReviewsList();
  }, [shopId]);

  // Fetch whether user has favorited this shop
  React.useEffect(() => {
    if (!token || !shopId) {
      setIsLiked(false);
      return;
    }
    const fetchFavoriteStatus = async () => {
      try {
        const res = await api.get('/api/favorites/my');
        const favs = Array.isArray(res.data) ? res.data : [];
        const liked = favs.some(f => f.shopId === shopId);
        setIsLiked(liked);
      } catch (err) {
        console.error('Error fetching favorites:', err);
      }
    };
    fetchFavoriteStatus();
  }, [token, shopId]);

  const scrollToReviews = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("DEBUG [scrollToReviews] Scrolling to reviews section");
    const element = document.getElementById("reviews-section");
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleToggleFavorite = async () => {
    if (!token) {
      alert('Please login to save this shop.');
      return;
    }
    if (likeLoading) return;
    // Optimistic update
    const prevLiked = isLiked;
    setIsLiked(!isLiked);
    setLikeLoading(true);
    try {
      const res = await api.post('/api/favorites/toggle', { shopId });
      // Sync with server response
      setIsLiked(res.data?.liked ?? !prevLiked);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setIsLiked(prevLiked);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleShareShop = async () => {
    const shopUrl = window.location.href;
    const shareData = {
      title: shop?.name || 'Shop on Go2Pick',
      text: `Check out ${shop?.name || 'this shop'} on Go2Pick`,
      url: shopUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled or API error — silently ignore
        if (err?.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shopUrl);
        setShareMessage('Shop link copied.');
        setTimeout(() => setShareMessage(''), 3000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    }
  };

  const handlePostReview = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log("DEBUG [handlePostReview] Selected rating:", selectedRating);
    console.log("DEBUG [handlePostReview] Comment:", comment);
    console.log("DEBUG [handlePostReview] ShopId:", shopId);

    if (!token) {
      console.log("DEBUG [handlePostReview] No token found");
      setRatingMessage("Please login to rate this shop.");
      return;
    }
    if (selectedRating === 0) {
      console.log("DEBUG [handlePostReview] selectedRating is 0");
      setRatingMessage("Please select a rating.");
      return;
    }
    
    setSubmittingRating(true);
    setRatingMessage("");
    try {
      const payload = {
        shopId,
        rating: selectedRating,
        comment: comment || undefined
      };
      console.log("DEBUG [handlePostReview] Sending POST to /api/reviews with payload:", payload);
      const res = await api.post('/api/reviews', payload);
      console.log("DEBUG [handlePostReview] POST /api/reviews response:", res.data);

      if (res.data && res.data.success !== false) {
        setComment("");
        setSelectedRating(0);
        setRatingMessage("Review posted successfully");
        
        // Refresh shop details to update rating badge
        const sRes = await api.get(`/api/shops/${shopId}`);
        console.log("DEBUG [handlePostReview] updated shop rating response:", sRes.data);
        const shopData = sRes.data?.shop || sRes.data;
        setShop(shopData);

        // Refresh reviews list
        await fetchReviewsList();
      } else {
        console.warn("DEBUG [handlePostReview] API returned success = false");
        setRatingMessage("Failed to submit rating. Please try again.");
      }
    } catch (err) {
      console.error("DEBUG [handlePostReview] API error:", err);
      setRatingMessage(err.response?.data?.detail || "Error submitting rating.");
    } finally {
      setSubmittingRating(false);
    }
  };


  return (
    <>
      <div className="py-8 max-w-container-max mx-auto min-h-screen">
      {isLoading ? (
        <div className="text-center text-on-surface-variant pt-12">Loading shop details...</div>
      ) : !shop ? (
        <div className="text-center text-on-surface-variant pt-12">Shop not found. Go back and select a valid shop.</div>
      ) : (
        <div className="px-6">

<div className="relative w-full h-[300px] overflow-hidden">
<img alt={shop.name} className="shop-cover-image w-full h-full object-cover" src={shop.coverImageUrl || shop.imageUrl || shop.shopImageUrl || defaultShopImage}/>
<div className="absolute inset-0 bg-gradient-to-t from-on-surface/60 to-transparent"></div>
<div className="absolute bottom-md left-md right-md text-on-primary">
<div className="flex items-center gap-xs mb-xs">
<span onClick={scrollToReviews} className="cursor-pointer bg-success-green text-on-primary px-xs py-1 rounded-lg font-label-sm text-label-sm flex items-center gap-1">
                        {shop.rating && shop.rating > 0 ? shop.rating.toFixed(1) : '0.0'} <span className="material-symbols-outlined text-[14px]" style={{fontVariationSettings: '\'FILL\' 1'}}>star</span>
</span>
<span onClick={scrollToReviews} className="cursor-pointer bg-white/20 backdrop-blur-md px-xs py-1 rounded-lg font-label-sm text-label-sm">
  {shop.ratingCount || 0} Review{shop.ratingCount === 1 ? '' : 's'}
</span>
<button onClick={scrollToReviews} className="cursor-pointer text-white/90 hover:text-white underline text-xs font-semibold ml-xs bg-transparent border-0 outline-none">
  View Reviews
</button>
</div>
<h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg">{shop.name}</h2>
</div>
</div>

<section className="bg-white px-md py-lg shadow-sm">
<div className="grid grid-cols-1 md:grid-cols-3 gap-md items-center">
<div className="flex flex-col gap-xs">
<div className="flex items-center gap-sm text-on-surface-variant">
<span className="material-symbols-outlined text-trust-blue">location_on</span>
<p className="font-body-md text-body-md">{shop.address || 'Address not available'}</p>
</div>
<div className="flex items-center gap-sm text-on-surface-variant">
<span className="material-symbols-outlined text-trust-blue">schedule</span>
<p className="font-body-md text-body-md">Open: {formatIndianTime(shop.opening_time)} - {formatIndianTime(shop.closing_time)}</p>
</div>
</div>

{/* Center Column: Rate this Shop card */}
<div className="flex justify-center w-full">
  <div className="w-full max-w-[280px] bg-slate-50 rounded-2xl p-sm shadow-sm border border-border-gray/50 flex flex-col items-center">
    <h3 className="font-label-sm text-label-sm font-bold text-slate-800 mb-xs">Rate this Shop</h3>
    {!token ? (
      <div className="flex items-center gap-1 text-warning-amber bg-amber-50 px-2 py-1 rounded-lg text-[10px] font-medium text-center">
        <span className="material-symbols-outlined text-sm">warning</span>
        <span>Please login to rate.</span>
      </div>
    ) : (
      <div className="w-full flex flex-col items-center gap-xs">
        {/* Stars row */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform active:scale-95"
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={submittingRating}
            >
              <span 
                className="material-symbols-outlined text-xl" 
                style={{
                  fontVariationSettings: `'FILL' ${(hoverRating || selectedRating) >= star ? 1 : 0}`,
                  color: (hoverRating || selectedRating) >= star ? '#F59E0B' : '#94A3B8'
                }}
              >
                star
              </span>
            </button>
          ))}
        </div>

        {/* Comment input + Post button */}
        <div className="w-full flex items-center gap-xs mt-1">
          <input
            type="text"
            placeholder="Comment (opt)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submittingRating}
            className="w-0 flex-grow text-xs border border-border-gray rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handlePostReview}
            disabled={submittingRating}
            className="bg-primary text-white text-[11px] font-bold px-2 py-1 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            Post
          </button>
        </div>

        {ratingMessage && (
          <p className={`text-[10px] font-semibold text-center leading-tight mt-1 ${ratingMessage.includes("successfully") || ratingMessage.includes("Thank you") ? "text-success-green" : "text-error-red"}`}>
            {ratingMessage}
          </p>
        )}
      </div>
    )}
  </div>
</div>

<div className="flex items-center gap-md md:justify-end">
<div className="text-center px-lg border-r border-border-gray">
<p className="font-label-sm text-label-sm text-on-surface-variant">Type</p>
<p className="font-title-md text-title-md text-trust-blue font-bold">Pickup Only</p>
</div>
<div className="text-center px-lg">
<p className="font-label-sm text-label-sm text-on-surface-variant">Availability</p>
<p className="font-title-md text-title-md text-trust-blue font-bold">Ready after confirm</p>
</div>
</div>
</div>
</section>

<nav className="sticky top-16 bg-surface z-40 py-md px-md border-b border-border-gray hide-scrollbar overflow-x-auto flex gap-sm whitespace-nowrap">
{Object.keys(groupedProducts).map((cat, i) => (
  <a key={i} className={`px-lg py-2 rounded-full font-label-sm text-label-sm transition-colors ${i === 0 ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} href={`#cat-${i}`}>
    {cat}
  </a>
))}
</nav>

<div className="px-md mt-lg space-y-xl pb-24">

{Object.entries(groupedProducts).length === 0 ? (
  <p className="text-center py-8 text-on-surface-variant">No products available in this shop yet.</p>
) : (
  Object.entries(groupedProducts).map(([cat, products], i) => (
    <section key={i} id={`cat-${i}`}>
    <h3 className="font-title-md text-title-md mb-md flex items-center gap-xs">
                        {cat}
                        <span className="h-1 flex-grow bg-surface-container-high rounded-full ml-sm"></span>
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">

    {products.map(item => (
    <div key={item.id} onClick={() => navigate(`/product/${item.id}`)} className="bg-white p-sm rounded-xl shadow-sm flex gap-md items-center group hover:shadow-md transition-shadow cursor-pointer">
    <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
    <img alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" src={item.image || 'https://placehold.co/150'}/>
    </div>
    <div className="flex-grow">
    <h4 className="font-title-md text-body-lg font-semibold line-clamp-2">{item.name}</h4>
    <p className="font-body-md text-body-md text-on-surface-variant mb-sm line-clamp-1">{item.description}</p>
    <div className="flex items-center justify-between">
    <span className="font-title-md text-trust-blue">₹{item.price.toFixed(2)} / {item.unit || 'pc'}</span>
    <button onClick={(e) => { 
      e.stopPropagation(); 
      // Ensure properties match what CartContext expects for MongoDB items
      addToCart({
        id: item.id,
        product_name: item.name,
        product_image: item.image,
        product_price: item.price,
        product_unit: item.unit || 'pc',
        shop_id: item.shop_id || item.shopId
      }); 
    }} className="add-btn flex items-center justify-center w-10 h-10 rounded-full bg-primary-container text-on-primary-container active:scale-90 transition-transform shadow-sm">
    <span className="material-symbols-outlined">add</span>
    </button>
    </div>
    </div>
    </div>
    ))}
    </div>
    </section>
  ))
)}

          {/* Reviews Section */}
          <section id="reviews-section" className="bg-white p-md rounded-2xl border border-border-gray/30 shadow-sm mt-lg">
            <h3 className="font-title-md text-title-md text-slate-800 font-semibold mb-sm flex items-center gap-xs">
              Reviews & Feedback
              <span className="h-1 flex-grow bg-surface-container-high rounded-full ml-sm"></span>
            </h3>

            {reviews.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-lg text-center border border-border-gray/50">
                <p className="text-on-surface-variant font-body-md">No reviews yet.</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-md">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-slate-50 p-md rounded-2xl border border-border-gray/30 flex flex-col gap-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-body-md">{r.userName || r.customerName || "Anonymous"}</span>
                      <span className="text-xs text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className="material-symbols-outlined text-sm" 
                          style={{
                            fontVariationSettings: `'FILL' ${r.rating >= star ? 1 : 0}`,
                            color: r.rating >= star ? '#F59E0B' : '#CBD5E1'
                          }}
                        >
                          star
                        </span>
                      ))}
                    </div>

                    {r.comment && (
                      <p className="text-slate-600 text-body-md mt-1 leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    )}
    </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-md z-50">
        <Link to="/cart" className="w-full h-14 bg-trust-blue text-on-primary rounded-full shadow-lg flex items-center justify-between px-lg active:scale-95 transition-all" id="view-cart-fab">
<div className="flex items-center gap-md">
<div className="relative">
<span className="material-symbols-outlined">shopping_cart</span>
<span className="absolute -top-2 -right-2 bg-error-red text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-trust-blue font-bold" id="Cart-badge">{cartCount}</span>
</div>
<span className="font-title-md text-body-lg">View Cart</span>
</div>
<span className="font-title-md text-body-lg" id="cart-total">₹{(cartTotal || 0).toFixed(2)}</span>
</Link>
</div>





    </>
  );
}
