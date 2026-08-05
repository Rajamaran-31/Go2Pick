import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ShopReviews() {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!shopId) {
      setErrorMsg("Invalid Shop ID");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const [shopRes, reviewsRes] = await Promise.all([
          api.get(`/api/shops/${shopId}`),
          api.get(`/api/reviews`, { params: { shopId } })
        ]);

        const shopData = shopRes.data?.shop || shopRes.data;
        setShop(shopData);

        const reviewsData = reviewsRes.data?.reviews || [];
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching shop reviews data:", err);
        setErrorMsg("Failed to load reviews. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm h-16 flex items-center px-md justify-between">
        <div className="flex items-center gap-md">
          <button 
            type="button"
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95" 
            onClick={() => navigate(`/shop-details?id=${shopId}`)}
          >
            <span className="material-symbols-outlined text-trust-blue">arrow_back</span>
          </button>
          <h1 className="font-title-md text-title-md text-trust-blue">Reviews</h1>
        </div>
      </nav>

      {isLoading ? (
        <div className="pt-32 text-center text-on-surface-variant font-medium animate-pulse">
          Loading reviews...
        </div>
      ) : errorMsg ? (
        <div className="pt-32 text-center text-error-red font-medium px-md">
          {errorMsg}
          <div className="mt-md">
            <Link to={`/shop-details?id=${shopId}`} className="text-trust-blue hover:underline text-sm font-semibold">
              Go back to Shop
            </Link>
          </div>
        </div>
      ) : (
        <main className="pt-20 px-md pb-24 max-w-md mx-auto space-y-md">
          {/* Shop Header Summary */}
          <div className="bg-white rounded-2xl p-md shadow-sm border border-border-gray/50 text-center flex flex-col items-center gap-xs">
            <h2 className="font-title-md text-headline-lg-mobile text-slate-800 font-bold">{shop ? shop.name : "Shop"}</h2>
            
            <div className="flex items-center gap-sm mt-xs">
              <span className="bg-success-green text-on-primary px-sm py-1 rounded-xl font-title-md text-body-lg flex items-center gap-1 font-bold">
                {shop && shop.rating && shop.rating > 0 ? shop.rating.toFixed(1) : '0.0'} 
                <span className="material-symbols-outlined text-[16px] font-bold" style={{fontVariationSettings: '\'FILL\' 1'}}>star</span>
              </span>
              <span className="text-sm font-medium text-slate-500">
                {shop && shop.ratingCount || 0} Review{shop && shop.ratingCount === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Reviews Comments list */}
          <div className="space-y-sm">
            <h3 className="font-title-md text-body-lg text-slate-800 font-semibold mb-xs">Customer Feedback</h3>
            
            {reviews.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-lg text-center border border-border-gray/50">
                <p className="text-on-surface-variant font-body-md">No reviews yet.</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to share your experience!</p>
              </div>
            ) : (
              <div className="space-y-md">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-white p-md rounded-2xl shadow-sm border border-border-gray/30 flex flex-col gap-xs">
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
          </div>
        </main>
      )}
    </>
  );
}
