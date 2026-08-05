import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function WelcomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < 2) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <>
      
{/* The Shell Navigation is Suppressed (Linear/Transactional Rule) */}
<main className="w-full max-w-container-max mx-auto px-lg h-screen flex flex-col md:flex-row items-center justify-between relative">
{/* Left Section: Content & Branding */}
<div className="z-10 w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left py-2xl">
<div className="mb-xl">
<h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-trust-blue font-black tracking-tight mb-xs">
                    Go2Pick
                </h1>
<div className="h-1 w-12 bg-marketplace-orange rounded-full"></div>
</div>
<div className="mb-2xl space-y-md">
<h2 className="font-display-lg text-display-lg leading-tight text-on-surface max-w-md">
                    Pick up anything local.
                </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-sm">
                    Discover the best shops in your neighborhood and skip the wait with easy local pickup.
                </p>
</div>
{/* Onboarding Step Indicator */}
<div className="flex gap-2 mb-2xl">
<div className={`h-2 rounded-full cursor-pointer transition-all ${currentSlide === 0 ? 'w-8 bg-trust-blue' : 'w-2 bg-outline-variant'}`} onClick={() => setCurrentSlide(0)}></div>
<div className={`h-2 rounded-full cursor-pointer transition-all ${currentSlide === 1 ? 'w-8 bg-trust-blue' : 'w-2 bg-outline-variant'}`} onClick={() => setCurrentSlide(1)}></div>
<div className={`h-2 rounded-full cursor-pointer transition-all ${currentSlide === 2 ? 'w-8 bg-trust-blue' : 'w-2 bg-outline-variant'}`} onClick={() => setCurrentSlide(2)}></div>
</div>
{/* Action Buttons */}
<div className="flex flex-col sm:flex-row items-center gap-md w-full sm:w-auto">
<button className="w-full sm:w-48 py-md px-xl bg-trust-blue text-on-primary font-title-md text-title-md rounded-xl shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:scale-95 transition-all duration-200" onClick={handleNext}>
                    {currentSlide < 2 ? 'Next' : 'Get Started'}
                </button>
<button className="w-full sm:w-auto py-md px-xl text-on-surface-variant font-title-md text-title-md hover:bg-surface-container-low rounded-xl transition-colors" onClick={() => navigate('/login')}>
                    Skip
                </button>
</div>
</div>
{/* Right Section: Visual Experience (Bento/Card Hybrid) */}
<div className="relative w-full md:w-1/2 h-[442px] md:h-full flex items-center justify-center py-xl overflow-visible">
{/* Background Decorative Elements */}
<div className="absolute inset-0 z-0 pointer-events-none">
<div className="absolute top-1/4 right-0 w-64 h-64 bg-surface-container-high rounded-full mix-blend-multiply filter blur-3xl opacity-30"></div>
<div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-marketplace-orange rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
</div>
{/* Main Feature Image Card */}
<div className="relative z-10 w-full max-w-md md:max-w-xl float-animation">
<div className="aspect-[4/5] md:aspect-square rounded-[32px] overflow-hidden shadow-2xl border-8 border-white">
<img className="w-full h-full object-cover" data-alt="A vibrant and bustling local open-air marketplace filled with artisanal stalls, fresh organic produce, and warm, inviting storefronts under a soft morning sun. The lighting is golden and natural, emphasizing a high-trust, dependable atmosphere with a clean modern light-mode aesthetic. People are seen interacting cheerfully with shopkeepers, conveying a sense of community and efficient local commerce. The color palette is dominated by professional blues and energetic oranges, creating a sophisticated and professional corporate atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgnSzXxUl2B-0VjF-9YcQa5Px6dCrQ5HUkQqRXgqB8cr_xphZNRDGw5F3einVvKCiqFt42nQSuDl9EvDwbFrSdGBe2la6iBccP16boZ0TFNm0_39CavpHaZRV3uszkKR3l0FG4ImJPg7GtEHQhh8dFMtfurggAMhmeDMsoiXSp_qsX-MJ5BtbsTowzvq7qM21HhIjCdxA2zdDmKaygDUysqYxcPwAL-fcu1Kac86w8i_HHC6tvSERUMJ8xVHp7DdKkdAF3m4EN9aLB"/>
</div>
{/* Floating Glassmorphism Detail Card 1: Shop Tag */}
<div className="absolute -top-6 -right-6 glass-panel p-md rounded-2xl shadow-xl flex items-center gap-md animate-bounce [animation-duration:3s]">
<div className="w-10 h-10 bg-marketplace-orange rounded-full flex items-center justify-center text-white">
<span className="material-symbols-outlined">storefront</span>
</div>
<div>
<div className="font-title-md text-label-sm text-on-surface">Artisan Bakery</div>
<div className="text-xs text-on-surface-variant">Ready in 15 mins</div>
</div>
</div>
{/* Floating Glassmorphism Detail Card 2: Status */}
<div className="absolute -bottom-10 -left-10 glass-panel p-md rounded-2xl shadow-xl hidden sm:flex items-center gap-md">
<div className="w-10 h-10 bg-success-green rounded-full flex items-center justify-center text-white">
<span className="material-symbols-outlined" style={{'fontVariationSettings': "\'FILL\' 1"}}>check_circle</span>
</div>
<div>
<div className="font-title-md text-label-sm text-on-surface">Order Picked Up</div>
<div className="text-xs text-on-surface-variant">Fastest route found</div>
</div>
</div>
</div>
{/* Minimal Statistics Badge */}
<div className="absolute top-1/2 left-0 -translate-x-1/2 bg-white rounded-full px-lg py-sm shadow-md border border-border-gray flex items-center gap-xs">
<span className="w-2 h-2 bg-trust-blue rounded-full animate-pulse"></span>
<span className="font-label-sm text-trust-blue">50+ Local Partners</span>
</div>
</div>
</main>
{/* Interactive Layer: Ripple Effect Container */}
<div className="fixed inset-0 pointer-events-none z-[100]" id="ripple-container"></div>


    </>
  );
}
