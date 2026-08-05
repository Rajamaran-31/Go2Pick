import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function MyReviews() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get('/api/customer/reviews').then(res => {
      if (res.data?.reviews) setReviews(res.data.reviews);
    }).catch(err => console.error("API Error:", err));
  }, []);


  return (
    <div className="bg-surface min-h-screen pb-safe">
      <header className="bg-surface/80 dark:bg-surface/80 backdrop-blur-md fixed top-0 w-full z-50 shadow-sm flex items-center px-md h-14">
        <button onClick={() => navigate('/profile')} className="active:scale-95 transition-transform text-primary p-2 -ml-2 rounded-full hover:bg-surface-container">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline-sm text-headline-sm text-on-surface font-bold ml-sm">My Reviews</h1>
      </header>

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-md">
        {reviews.length === 0 ? (
           <div className="py-2xl flex flex-col items-center justify-center text-center">
             <span className="material-symbols-outlined text-[48px] text-outline mb-4">rate_review</span>
             <h3 className="text-headline-sm font-bold text-on-surface mb-2">No Reviews Yet</h3>
             <p className="text-body-md text-on-surface-variant">You haven't left any reviews. Once you do, they will appear here.</p>
           </div>
        ) : (
          reviews.map(review => (
            <div key={review.id} className="glass-card p-md rounded-xl shadow-sm border border-border-gray">
              <div className="flex justify-between items-start mb-sm">
                <div>
                  <h3 className="font-title-md font-bold text-on-surface">{review.targetName}</h3>
                  <p className="font-label-sm text-on-surface-variant">{review.type}</p>
                </div>
                <span className="font-label-sm text-on-surface-variant">{review.date}</span>
              </div>
              <div className="flex gap-1 mb-sm">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-[18px] ${i < review.rating ? 'text-warning-amber' : 'text-outline-variant'}`} style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>
                    star
                  </span>
                ))}
              </div>
              <p className="font-body-md text-on-surface leading-relaxed">"{review.text}"</p>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
