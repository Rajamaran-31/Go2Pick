import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export default function ImportProducts() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      
{/* Top Navigation Anchor */}
<header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-border-gray shadow-sm h-14 flex items-center justify-between px-md">
<div className="flex items-center gap-md">
<span className="material-symbols-outlined text-trust-blue cursor-pointer active:scale-95 duration-150">menu</span>
<h1 className="text-headline-lg-mobile font-headline-lg-mobile text-trust-blue font-black tracking-tight">Go2Pick</h1>
</div>
<div className="flex items-center gap-md">
<div className="hidden md:flex gap-lg items-center px-lg h-full">
<Link to="/shopkeeper">Dashboard</Link>
<Link className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-xs py-1 rounded-lg font-label-sm text-label-sm" to="/shopkeeper/products">Inventory</Link>
<Link className="text-on-surface-variant hover:bg-surface-container-low transition-colors px-xs py-1 rounded-lg font-label-sm text-label-sm" to="/shopkeeper/orders">Orders</Link>
</div>
<img alt="Admin User Profile" className="w-8 h-8 rounded-full border-2 border-marketplace-orange p-0.5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEYnWtm4YsJ3sOWGYC4C7nOmQZu3HYBU___qu8hUmZFWkL3IHPd785j1AVNHIXgusZnQ3iu1vltPktv6UIsgGtCFO3ZtzR5y7s46SOeH0VglMR6UIbOKw3eRgQpFAOnjKsYbOOO5VNqMyG74MQs_9IokLuwaBuhCTtsJU5q3TI1X4uieqM0ItGnDU1MzEWH-Z6VlsD8wwc5ZrrBzyaHq6d1i36at7s_dANNNTKoMWGOBzcOEHtB1Qo4IRqPf0yegG0cMIWe780i2XK"/>
</div>
</header>
<main className="pt-20 px-md md:px-lg max-w-container-max mx-auto">
<div className="flex flex-col gap-lg">
{/* Header Section */}
<div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
<div className="space-y-1">
<span className="text-marketplace-orange font-bold font-label-sm text-label-sm uppercase tracking-widest flex items-center gap-xs">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-marketplace-orange opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-marketplace-orange"></span>
</span>
                        Processing...
                    </span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Bulk Product Import</h2>
<p className="text-on-surface-variant max-w-2xl">Uploading your latest inventory collection. Please do not close this window until the process reaches 100%.</p>
</div>
<div className="flex items-center gap-sm">
<span className="text-title-md font-title-md text-on-surface">75%</span>
<span className="text-body-md text-on-surface-variant">38 of 50 imported</span>
</div>
</div>
{/* Progress & Primary Status Canvas */}
<div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] p-lg border border-border-gray overflow-hidden relative">
<div className="w-full bg-surface-container h-4 rounded-full overflow-hidden mb-lg relative">
<div className="h-full bg-marketplace-orange transition-all duration-1000 ease-in-out relative" id="progress-bar" style={{'width': '75%'}}>
<div className="absolute inset-0 animate-progress-shimmer"></div>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div className="flex flex-col gap-xs">
<span className="text-on-surface-variant font-label-sm text-label-sm">ESTIMATED TIME</span>
<span className="text-title-md font-title-md text-on-surface">~1 min remaining</span>
</div>
<div className="flex flex-col gap-xs">
<span className="text-on-surface-variant font-label-sm text-label-sm">SUCCESSFUL</span>
<span className="text-title-md font-title-md text-success-green">38 Products</span>
</div>
<div className="flex flex-col gap-xs">
<span className="text-on-surface-variant font-label-sm text-label-sm">FAILED / SKIPPED</span>
<span className="text-title-md font-title-md text-on-surface">0 Products</span>
</div>
</div>
</div>
{/* Detailed Log Grid (Asymmetric/Bento Style) */}
<div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
{/* Main Processing List */}
<div className="md:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] border border-border-gray flex flex-col h-full">
<div className="p-md border-b border-border-gray flex justify-between items-center">
<h3 className="font-title-md text-title-md text-on-surface">Import History</h3>
<span className="text-on-surface-variant font-label-sm text-label-sm">Live Feed</span>
</div>
<div className="p-xs space-y-1 overflow-y-auto max-h-[500px]">
{/* Processing Item */}
<div className="flex items-center gap-md p-md bg-secondary-container/5 rounded-lg border border-marketplace-orange/20 animate-pulse">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
<img alt="Current product" className="rounded-sm" data-alt="A professional product photography shot of a high-end minimalist smartwatch with a leather strap. The watch is placed on a clean white marble surface with soft natural lighting and a marketplace-orange accent glow in the background. The mood is sophisticated and sleek, matching a modern corporate design aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDf7d-7zgPbizSM1MHjxdPBi7MMGbaoYO6k3y2G2IynuMc4vNI7nMZ0mbGKJuj4oJ-oNx8VxJWjt1NRAzQAWu7kYPF5pY4T4ELGKnz3skqoLJOUsAnMHfMCLnQBxoiIktYGacFgaa6s3bk-AUba_9mLG9ZCOElwEj9DsOZlykuBcPRellNW2H58E8h3Z4mMsRuZKL4wDMDf93nLRzWBAxvr6myL73TiqES0QuOnYsT3TK1cqQX26DdyXaZKFaKq6_SuVcfX53aJ02NB"/>
</div>
<div className="flex-1 min-w-0">
<p className="text-on-surface font-bold truncate">Premium Series Hybrid Watch - Space Gray</p>
<p className="text-marketplace-orange text-label-sm font-label-sm">Extracting metadata and optimizing images...</p>
</div>
<div className="flex flex-col items-end gap-1">
<span className="material-symbols-outlined text-marketplace-orange animate-spin">sync</span>
</div>
</div>
{/* Success Item 1 */}
<div className="flex items-center gap-md p-md hover:bg-surface-container-low/50 rounded-lg transition-colors">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
<img alt="Product" className="rounded-sm" data-alt="A high-quality studio shot of a crisp, white organic cotton t-shirt neatly folded on a neutral gray background. The lighting is bright and even, highlighting the fabric texture. The shot follows a professional e-commerce style with high-trust, clean visual appeal and precise detail." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZWRsUInilzD72-3knVZFwdNXLPRq5U4QRjNOsxHN-P2a7jYaSgx-BkVDRAIOFGpcLQn0ta-ftu-bPsp_yE-Q8D5lTrVwsal2ahbkWNnjxmh4bg3nX1ycRQEG4j-Cl3zSLb4n0AFeW2piRrL2U3Cu7WZ5KfDU_3K654I5Sw1746zs5GtzbXM9mF4_hyJuMnWbVdx-oa4z1m_p34T1DLchOH6EhhYKEh5m4ze-zHOCAyhBX69uiF7H3a29f_WyyGIZXRy3dfPjkNuVW"/>
</div>
<div className="flex-1 min-w-0">
<p className="text-on-surface font-bold truncate">Organic Cotton Essential Tee - Arctic White</p>
<p className="text-on-surface-variant text-label-sm font-label-sm">SKU: TS-OW-001 • Category: Apparel</p>
</div>
<div className="flex items-center gap-xs text-success-green">
<span className="text-label-sm font-label-sm">Processed</span>
<span className="material-symbols-outlined text-[18px]" style={{'fontVariationSettings': "\'FILL\' 1"}}>check_circle</span>
</div>
</div>
{/* Success Item 2 */}
<div className="flex items-center gap-md p-md hover:bg-surface-container-low/50 rounded-lg transition-colors">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
<img alt="Product" className="rounded-sm" data-alt="Modern high-performance running shoes in a vibrant marketplace-orange and deep blue colorway. The shoes are captured in a dynamic action pose against a minimalist studio background with soft atmospheric shadows. The lighting is professional and high-key, emphasizing durability and athletic performance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDg0gW5VVutaZGQnEmDw7LNJ4eztFBEZA8JmdjJtvVu3M4gkx9qdilTmRr3ahI8VfougnEVmQiDAoOEF3-mMPoccv_z2DEVhO37XfyBjlGtj45FspXnGw3SQ95AJle_2oLPZthZXF_j15ShYq6E4gMZaFs7jmgxbAr8gh9zXLOVvVFEf1UHqt2PYG963w3zhfpV_tGYOtkaJNQJv-acc5G-i5-BhHVZqMxUOHcMyTC4f9eObLAO_PYzsTdyOwugeFJJbmAmExhRHyhQ"/>
</div>
<div className="flex-1 min-w-0">
<p className="text-on-surface font-bold truncate">AeroGlide Pro Performance Sneakers</p>
<p className="text-on-surface-variant text-label-sm font-label-sm">SKU: FW-AGP-042 • Category: Footwear</p>
</div>
<div className="flex items-center gap-xs text-success-green">
<span className="text-label-sm font-label-sm">Processed</span>
<span className="material-symbols-outlined text-[18px]" style={{'fontVariationSettings': "\'FILL\' 1"}}>check_circle</span>
</div>
</div>
{/* Success Item 3 */}
<div className="flex items-center gap-md p-md hover:bg-surface-container-low/50 rounded-lg transition-colors">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
<img alt="Product" className="rounded-sm" data-alt="A pair of sleek black noise-cancelling over-ear headphones displayed in a professional cinematic product shot. The lighting is dramatic but clean, highlighting the metallic finishes and premium leather ear cushions. The overall atmosphere is premium and tech-focused, aligned with high-trust corporate standards." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEchUID3KA0qaDYpkdLobiLAnZAJPOzUmSqH4D00H8GCgxm_Bl2MmGvnp3R96dnOtfunvUPAfF0s7Kytw42r3QSa_jX5OWhS_SbOgnsPXzr1L-N0R5iHQaUlgnPMC4quxy9vZqtEzE31zBxf7r1Bm37NXR8UltNcVPXPi4qZ6OHceSD9p1c9W-pTQDnFnHb__hhq5fAXWWGtru3K6V6Uwmkrpl4kgyUxAGc-EFbBo-D_g1vFpFSK6NldTLPkqmB90tu7_Q_thj4Ozb"/>
</div>
<div className="flex-1 min-w-0">
<p className="text-on-surface font-bold truncate">Sonic-X Noise Cancelling Headphones</p>
<p className="text-on-surface-variant text-label-sm font-label-sm">SKU: AC-SXN-089 • Category: Electronics</p>
</div>
<div className="flex items-center gap-xs text-success-green">
<span className="text-label-sm font-label-sm">Processed</span>
<span className="material-symbols-outlined text-[18px]" style={{'fontVariationSettings': "\'FILL\' 1"}}>check_circle</span>
</div>
</div>
{/* Success Item 4 */}
<div className="flex items-center gap-md p-md hover:bg-surface-container-low/50 rounded-lg transition-colors">
<div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
<img alt="Product" className="rounded-sm" data-alt="A durable, water-resistant navy blue commuter backpack shown from a front-three-quarters angle. The backpack is standing upright in a well-lit modern studio setting. The visual style is clean, corporate, and focuses on the high-quality stitching and utilitarian design of the product." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvkwvZF631dleeEkqlGxs0qmUJcSQ1ONx0SmSWbnWVXwmpdQM6xfYjAPPfOsYiV-mHiZiIi3lAHnKmHNvL8UrG03vaKv5-RyHAPyw6xYPH7MAqEZQZFW8DEKCV1ODtIPGLC7krly5TOGf7eI5JoWXc_OF9BKSiD74OFto35xpXS3dJ3CnefEcs1WopMhKwghG9TvvriNFc-7iqHa9bTx9gz6lMD8bUPUQqRHLEE3UFGNQOMdJBnSTINpaqdNM9Dh7_Tzyt2q2cn79G"/>
</div>
<div className="flex-1 min-w-0">
<p className="text-on-surface font-bold truncate">Urban Commuter 20L Weather-Resistant Pack</p>
<p className="text-on-surface-variant text-label-sm font-label-sm">SKU: BG-UCP-015 • Category: Accessories</p>
</div>
<div className="flex items-center gap-xs text-success-green">
<span className="text-label-sm font-label-sm">Processed</span>
<span className="material-symbols-outlined text-[18px]" style={{'fontVariationSettings': "\'FILL\' 1"}}>check_circle</span>
</div>
</div>
</div>
</div>
{/* Secondary Control Panels */}
<div className="md:col-span-4 flex flex-col gap-gutter">
{/* Data Stats Card */}
<div className="bento-card bg-surface-container-lowest rounded-xl p-lg border-t-4 border-marketplace-orange shadow-sm border-x border-b border-border-gray">
<h4 className="font-title-md text-title-md text-on-surface mb-md">Import Stats</h4>
<div className="space-y-md">
<div className="flex justify-between items-center py-xs">
<span className="text-on-surface-variant">Total CSV Rows</span>
<span className="font-bold">52</span>
</div>
<div className="flex justify-between items-center py-xs">
<span className="text-on-surface-variant">Validated Images</span>
<span className="font-bold">144</span>
</div>
<div className="flex justify-between items-center py-xs border-t border-border-gray pt-md">
<span className="text-on-surface-variant">Estimated Finish</span>
<span className="text-trust-blue font-bold">14:48 PM</span>
</div>
</div>
</div>
{/* Actions Card */}
<div className="bg-surface-container rounded-xl p-lg flex flex-col gap-lg items-center text-center">
<div className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center text-marketplace-orange shadow-inner">
<span className="material-symbols-outlined text-4xl">cloud_upload</span>
</div>
<div className="space-y-2">
<h4 className="font-title-md text-title-md text-on-surface">Almost Ready</h4>
<p className="text-body-md text-on-surface-variant">Review the imported list once the processing reaches 100% to finalize publication.</p>
</div>
<div className="w-full flex flex-col gap-sm">
<button className="w-full py-md px-lg bg-outline text-surface-container-lowest font-bold rounded-xl cursor-not-allowed opacity-60 flex items-center justify-center gap-xs transition-all" disabled="">
                                Approve &amp; Publish
                                <span className="material-symbols-outlined text-[20px]">send</span>
</button>
<button onClick={() => navigate('/shopkeeper/products')} className="w-full py-md px-lg text-error-red border border-error-red/20 font-bold rounded-xl hover:bg-error-red/5 active:scale-95 transition-all">
                                Abort Upload
                            </button>
</div>
</div>
{/* Help Tooltip */}
<div className="bg-primary-container/10 p-md rounded-xl flex gap-md items-start">
<span className="material-symbols-outlined text-primary">info</span>
<p className="text-label-sm font-label-sm text-on-primary-fixed-variant">Images are automatically resized to 1200x900px for optimal performance on the customer storefront.</p>
</div>
</div>
</div>
</div>
</main>
{/* Bottom Navigation Shell (Mobile Only) */}



    </>
  );
}
