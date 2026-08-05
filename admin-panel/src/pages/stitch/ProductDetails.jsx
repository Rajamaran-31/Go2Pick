import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

export default function ProductDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      api.get(`/api/products/${id}`)
        .then(res => {
          const data = res.data;
          const item = data.product || data.data || data;
          setProduct(item);
        })
        .catch(err => {
          console.error("Product fetch failed", err);
          setProduct(null);
        });
    }
  }, [id]);

  if (!product) return <div className="p-8 text-center">Loading...</div>;

  return (
    <>
      
{/* Top AppBar (Back & Fav) */}
<header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-sm h-14 flex justify-between items-center px-lg">
<button aria-label="Go back" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150" onClick={() => navigate(-1)}>
<span className="material-symbols-outlined text-trust-blue">arrow_back</span>
</button>
<span className="font-display-lg text-headline-lg-mobile font-bold text-trust-blue">Go2Pick</span>
<button aria-label="Add to favorites" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-150" id="fav-btn">
<span className="material-symbols-outlined text-trust-blue" id="fav-icon">favorite</span>
</button>
</header>
<main className="pt-14 pb-32">
{/* Hero Image Carousel Section */}
<section className="relative w-full aspect-[4/5] md:aspect-video overflow-hidden">
<div className="flex h-full transition-transform duration-500 ease-out" id="carousel">
{product.image ? (
  <img className="w-full h-full object-cover flex-shrink-0" src={product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`} alt={product.name} />
) : product.images && product.images.length > 0 ? (
  product.images.map((img, i) => (
    <img key={i} className="w-full h-full object-cover flex-shrink-0" src={img.startsWith('http') ? img : `http://localhost:8000${img}`} alt={product.name} />
  ))
) : (
  <>
  <img className="w-full h-full object-cover flex-shrink-0" data-alt="High-resolution, macro photography of roasted coffee beans in a rustic ceramic bowl. The lighting is soft and warm, highlighting the oily texture of the dark Arabica beans." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxmhpAAsRpOwOsw13HVV9Xl-uEuGyh428I6jpm9NlPjIXiXAt_qUIKsSA32-mVyAuXnJuBwRbxCx2HngIpD3QJ2qLlmUvvk6HNftOvbW-GWsXE43jSAGfvHTAiivy5dGj4U6sjM3nJzp9JyvGIbUGtA0trINpQZciKE_afvfzpR1hU9r0uzTUuw8drr91Z2lUPoXJGxenb03FaMUOgMZddMlm2IuIaxBtMbNQYhh5TG9hlR6YarAdnCDZwRErRYovAeuAxcij9CttE"/>
  <img className="w-full h-full object-cover flex-shrink-0" data-alt="A premium, matte-finished coffee bean bag standing on a clean marble countertop." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy9_Q0wP61Qg_hUUXaBBeGtgNB8Axrjnll3gPE56HQr09h3aPcvD-9bwEqTVm0fUSZ_icSuT_BxO_riXk8_s8Nqf-h0XY2uafnRZ3fUgcHql2EODBy0OBZMAZ4_2sxgQgouH1oufDPLuEMdoaEQSNGX7KtrFjgacWRGqCBRuSHSWkh2uFFwas6ObEW-MoVNK6EsrYjbohf8tG41zsTkCdmadSDTUPW0VSK_q9O22Nkav731l1d6XzKUDswSiGyh3AwHuQxIX9L5GgS"/>
  </>
)}
</div>
{/* Carousel Indicators */}
<div className="absolute bottom-md left-1/2 -translate-x-1/2 flex gap-xs">
<div className="w-2 h-2 rounded-full bg-on-surface/40"></div>
<div className="w-2 h-2 rounded-full bg-on-surface/40"></div>
</div>
</section>
{/* Product Content Canvas */}
<article className="px-lg -mt-xl relative z-10 bg-surface rounded-t-[32px] pt-lg">
<div className="flex justify-between items-start mb-sm">
<div className="flex flex-col gap-xs">
<span className="inline-flex items-center px-sm py-0.5 rounded-full bg-success-green/10 text-success-green font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[14px] mr-1" style={{'fontVariationSettings': "\'FILL\' 1"}}>check_circle</span>
                        In Stock
                    </span>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{product.name || 'Product'}</h1>
</div>
<div className="text-right">
<span className="font-headline-lg-mobile text-headline-lg-mobile text-trust-blue">₹{product.price || '0.00'} / {product.unit || 'pc'}</span>
<p className="text-label-sm font-label-sm text-on-surface-variant">per {product.unit || 'pc'}</p>
</div>
</div>
{/* Bento Info Grid */}
<div className="grid grid-cols-2 gap-gutter my-xl">
<div className="bg-surface-container-low p-md rounded-xl shadow-sm border border-border-gray/50">
<span className="material-symbols-outlined text-trust-blue mb-xs">star</span>
<p className="text-label-sm font-label-sm text-on-surface-variant">Rating</p>
<p className="font-title-md text-title-md text-on-surface">4.9/5.0</p>
</div>
<div className="bg-surface-container-low p-md rounded-xl shadow-sm border border-border-gray/50">
<span className="material-symbols-outlined text-trust-blue mb-xs">timer</span>
<p className="text-label-sm font-label-sm text-on-surface-variant">Roast</p>
<p className="font-title-md text-title-md text-on-surface">Medium</p>
</div>
</div>
{/* Description */}
<section className="space-y-md">
<h2 className="font-title-md text-title-md text-on-surface">Description</h2>
<p className="text-body-lg font-body-lg text-on-surface-variant leading-relaxed">
                    {product.description || 'No description available for this product.'}
                </p>
<div className="pt-base">
<button className="text-trust-blue font-label-sm text-label-sm flex items-center gap-xs">
                        Read more <span className="material-symbols-outlined">expand_more</span>
</button>
</div>
</section>
{/* Origin Section (Asymmetric Layout) */}
<section className="mt-xl flex flex-col gap-md">
<h2 className="font-title-md text-title-md text-on-surface">Origin &amp; Traceability</h2>
<div className="flex gap-gutter overflow-x-auto hide-scrollbar pb-base">
<div className="flex-shrink-0 w-64 h-40 rounded-xl overflow-hidden relative shadow-md">
<img className="w-full h-full object-cover" data-alt="A clean, minimalist topographical map illustration of the Ethiopian highlands, using a color palette of soft greys and vibrant blue markers. The style is modern and informational, reflecting high-trust data visualization standards. It reinforces the product's premium origin stories in a clear, sophisticated corporate design language." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAymmN-PsPR6Qhi0jhkfbIV5TA0CpxEBvZtlUczE169Ar8VCBBYs3b5rjuzBag2-W-t3qRz7yms9bWaOcT0KX9Kb3RSskTzip4aCxKhUWPh08NkdsvVR0sgqPNqKFNs3ZfBWHvq6UE6PPm-XZ-CnDMHV4Ewq7v5YzcEs_VTLCV_lW_50jdd9vOJRw2IKwyeCB6q94Kvq83mAXiGZigA5xvbhXnhQS2FrC2Fhlkb_P5eJ53_ILANUOkSjxFsf2rtKU3SoemQYSVcLlw"/>
<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-md">
<span className="text-white font-label-sm text-label-sm">Ethiopian Highlands</span>
</div>
</div>
<div className="flex-shrink-0 w-64 h-40 bg-surface-container-high rounded-xl p-md flex flex-col justify-center gap-xs border border-border-gray">
<span className="material-symbols-outlined text-trust-blue">eco</span>
<p className="font-title-md text-title-md">100% Organic</p>
<p className="text-body-md font-body-md text-on-surface-variant">Certified sustainable farming practices.</p>
</div>
</div>
</section>
</article>
</main>
{/* Bottom Sticky Navigation & Actions */}
<div className="fixed bottom-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-t border-border-gray/30 px-lg py-md flex items-center justify-between gap-xl shadow-[0_-4px_24px_-1px_rgba(0,0,0,0.08)]">
{/* Quantity Selector */}
<div className="flex items-center bg-surface-container-high rounded-full px-base py-base h-12">
<button className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors active:scale-90" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
<span className="material-symbols-outlined">remove</span>
</button>
<span className="w-10 text-center font-title-md text-title-md text-on-surface" id="qty-count">{quantity}</span>
<button className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors active:scale-90" onClick={() => setQuantity(quantity + 1)}>
<span className="material-symbols-outlined">add</span>
</button>
</div>
{/* Add to Cart */}
<button className="flex-1 h-12 bg-trust-blue text-white rounded-full font-title-md text-title-md flex items-center justify-center gap-xs active:scale-[0.98] transition-transform duration-150 shadow-md shadow-trust-blue/20" onClick={() => { addToCart({ ...product, id: product.id || product._id }, quantity); navigate('/cart'); }}>
<span className="material-symbols-outlined">shopping_cart</span>
            Add to Cart
        </button>
</div>


    </>
  );
}
