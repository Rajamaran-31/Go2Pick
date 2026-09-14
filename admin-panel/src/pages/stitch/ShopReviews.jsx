import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';

export default function ShopReviews() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');

  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [showReviewModal, setShowReviewModal] = useState(Boolean(orderId));
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    if (!shopId) return;
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

  useEffect(() => {
    if (!shopId) {
      setErrorMsg("Invalid Shop ID");
      setIsLoading(false);
      return;
    }
    fetchData();
  }, [shopId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert("Please write a comment describing your pickup experience.");
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post('/api/reviews', {
        shopId,
        orderId: orderId || undefined,
        rating: Number(rating),
        comment: comment.trim()
      });
      alert("🎉 Thank you! Your review has been submitted.");
      setShowReviewModal(false);
      setComment("");
      await fetchData();
    } catch (err) {
      console.error("Submit review error:", err);
      alert(err.response?.data?.detail || "Failed to submit review. You may need to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm h-16 flex items-center px-md justify-between">
        <div className="flex items-center gap-md">
          <button 
            type="button"
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors active:scale-95 cursor-pointer" 
            onClick={() => navigate(`/shop-details?id=${shopId}`)}
          >
            <span className="material-symbols-outlined text-trust-blue">arrow_back</span>
          </button>
          <h1 className="font-title-md text-title-md text-trust-blue">Reviews</h1>
        </div>
        <button
          onClick={() => setShowReviewModal(true)}
          className="bg-marketplace-orange hover:brightness-110 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-[16px]">rate_review</span>
          Write Review
        </button>
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

            <button
              onClick={() => setShowReviewModal(true)}
              className="mt-2 text-xs font-bold text-trust-blue hover:underline cursor-pointer"
            >
              + Rate your experience
            </button>
          </div>

          {/* Reviews Comments list */}
          <div className="space-y-sm">
            <div className="flex items-center justify-between mb-xs">
              <h3 className="font-title-md text-body-lg text-slate-800 font-semibold">Customer Feedback</h3>
              <span className="text-xs text-slate-500">{reviews.length} total</span>
            </div>
            
            {reviews.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-lg text-center border border-border-gray/50">
                <p className="text-on-surface-variant font-body-md">No reviews yet.</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to share your experience!</p>
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="mt-3 text-xs bg-trust-blue text-white px-3 py-1.5 rounded-lg font-bold"
                >
                  Write First Review
                </button>
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

      {/* Review Submission Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-title-md font-bold text-slate-800">Rate & Review Shop</h3>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setRating(s)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    >
                      <span 
                        className="material-symbols-outlined text-3xl"
                        style={{
                          fontVariationSettings: `'FILL' ${rating >= s ? 1 : 0}`,
                          color: rating >= s ? '#F59E0B' : '#CBD5E1'
                        }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-bold text-slate-700">{rating} / 5</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Your Review</label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="How was the shop preparation, packaging, and pickup experience?"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-marketplace-orange text-white font-bold text-xs hover:brightness-110 shadow-sm active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
