import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function NoOrdersFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      
{/* Top Navigation Bar */}
<header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-on-surface/80 backdrop-blur-md border-b border-border-gray dark:border-outline-variant shadow-sm flex items-center justify-between px-md h-14">
<div className="flex items-center gap-sm">
<button onClick={() => navigate('/orders')} className="p-xs hover:bg-surface-container-low transition-colors active:scale-95 duration-150 rounded-lg">
<span className="material-symbols-outlined text-trust-blue dark:text-inverse-primary" data-icon="menu">menu</span>
</button>
<h1 className="text-headline-lg-mobile font-headline-lg-mobile text-trust-blue font-black tracking-tight">Go2Pick</h1>
</div>
<div className="flex items-center gap-md">
<nav className="hidden md:flex items-center gap-lg mr-md">
<Link to="/profile">Dashboard</Link>
<Link className="text-trust-blue font-bold font-label-sm text-label-sm" to="/shopkeeper/orders">History</Link>
<Link className="text-on-surface-variant font-label-sm text-label-sm hover:text-trust-blue transition-colors" to="/shopkeeper/profile">Profile</Link>
</nav>
<div className="w-8 h-8 rounded-full overflow-hidden border border-border-gray active:scale-95 transition-transform cursor-pointer">
<img alt="Admin User Profile" data-alt="A clean, professional headshot of a friendly individual against a soft blue studio background. The person has a kind expression, wearing a smart casual outfit. High-key lighting ensures a modern and trustworthy appearance, consistent with a premium corporate app interface and a bright, high-trust visual language." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAEi-cJPc_m2b2bgceC4xxO_el1iN7l-lBv1Tsv0bx4zrU1eVj9TkFvw6Kzjg02pk48OHlckAq9lM-xg82pdRGa0-oQH2gULgo4xfDdbVpXjtSz6Z_cLU4NFzeBm4CM76NYRMaUNCK3MWQxn4HvSMmrmqLfbWkeJ8b42KhWjnEWoFL0nBjYA51vzMreXS3Fmx8sFAmMeABmEiaLqRSRl7yrw6NrKyzqyvTRVKdYqRtlNXoRdOtC-eXjNy_Hq6SSAqdHkXtvNZjy0rIm"/>
</div>
</div>
</header>
{/* Main Content Canvas */}
<main className="min-h-screen pt-24 pb-20 px-gutter flex flex-col items-center justify-center max-w-container-max mx-auto">
{/* Empty State Container */}
<div className="relative w-full max-w-lg text-center flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
{/* Floating Decorative Elements (Bento style background feel) */}
<div className="absolute -top-12 -left-8 w-24 h-24 bg-surface-container-high rounded-full blur-2xl opacity-60"></div>
<div className="absolute -bottom-16 -right-12 w-32 h-32 bg-primary-container/10 rounded-full blur-3xl opacity-50"></div>
{/* Central Illustration */}
<div className="relative mb-xl">
<div className="w-64 h-64 md:w-80 md:h-80 bg-surface-container-low rounded-[2.5rem] flex items-center justify-center overflow-hidden shadow-sm border border-white">
<img className="w-full h-full object-cover opacity-90 mix-blend-multiply" data-alt="A minimalist, high-quality photograph of an elegant empty shopping bag made of recycled material, sitting on a clean white surface with soft morning light. The shadows are long and diffused, creating a serene and spacious feel. The composition is artistic and minimalist, emphasizing clean lines and a modern marketplace aesthetic with professional, crisp photography." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDszmi-mxAV_cXFg3SvngdWj-_ZRXimAFlK0eyCAFblRHnMGRIrWgyihUpsJnTwzvbOH8KYfjFG_rDIK_HPT1koj43uq5GTRN6ObmY-dYaXwuaA1I0lXJfNm8GsOnFL0jCeO57xzvE8wccblafpb8_gGHN3cxkLf19RbkP4Ab5EdBIwCwc0ZjKDpfbUvxPzViuBBjQiQzetubQhQ_Pb55OOCn5k-95acY0oUW-IZASuQzDEEG2JnoggaEdww79FL5rPesQFX6MQ1qlm"/>
{/* Overlay Icon for reinforcement */}
<div className="absolute inset-0 flex items-center justify-center">
<div className="p-lg bg-white/60 backdrop-blur-md rounded-full shadow-lg border border-white">
<span className="material-symbols-outlined text-[48px] md:text-[64px] text-trust-blue" data-icon="search">search</span>
</div>
</div>
</div>
{/* Floating Detail Chips */}
<div className="absolute -right-4 top-1/4 animate-bounce duration-[3000ms] glass-card px-md py-xs rounded-xl shadow-sm border border-white flex items-center gap-xs">
<span className="material-symbols-outlined text-marketplace-orange text-body-lg" data-icon="local_fire_department" style={{'fontVariationSettings': "\'FILL\' 1"}}>local_fire_department</span>
<span className="font-label-sm text-label-sm text-on-surface">Trending Shops</span>
</div>
</div>
{/* Text Content */}
<div className="z-10 px-md">
<h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-sm">
                    No orders yet.
                </h2>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-xl leading-relaxed">
                    Hungry for something local? Explore the trending shops near you and place your first order.
                </p>
{/* Primary CTA */}
<button onClick={() => navigate('/')} className="bg-trust-blue text-on-primary font-title-md text-title-md px-xl py-md rounded-xl shadow-lg hover:bg-primary transition-all active:scale-95 hover:shadow-xl flex items-center gap-sm mx-auto group">
                    Start Exploring
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
{/* Secondary Suggestions (Asymmetric Bento Lite) */}
<div className="mt-2xl grid grid-cols-1 md:grid-cols-2 gap-md w-full">
<div className="p-lg bg-surface-container-low rounded-2xl border border-white shadow-sm flex items-start gap-md hover:bg-surface-container-high transition-colors cursor-pointer group">
<div className="p-sm bg-white rounded-xl text-marketplace-orange shadow-sm group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="restaurant" style={{'fontVariationSettings': "\'FILL\' 1"}}>restaurant</span>
</div>
<div className="text-left">
<span className="font-title-md text-body-md block font-bold mb-1">Local Bakeries</span>
<span className="text-label-sm text-on-surface-variant">Fresh pastries within 2km</span>
</div>
</div>
<div className="p-lg bg-surface-container-low rounded-2xl border border-white shadow-sm flex items-start gap-md hover:bg-surface-container-high transition-colors cursor-pointer group">
<div className="p-sm bg-white rounded-xl text-trust-blue shadow-sm group-hover:scale-110 transition-transform">
<span className="material-symbols-outlined" data-icon="shopping_basket" style={{'fontVariationSettings': "\'FILL\' 1"}}>shopping_basket</span>
</div>
<div className="text-left">
<span className="font-title-md text-body-md block font-bold mb-1">Weekly Groceries</span>
<span className="text-label-sm text-on-surface-variant">Essential bundles ready for pickup</span>
</div>
</div>
</div>
</div>
</main>
{/* Bottom Navigation Bar (Mobile only) */}



    </>
  );
}
