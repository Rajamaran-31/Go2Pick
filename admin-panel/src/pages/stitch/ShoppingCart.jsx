import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function ShoppingCart() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();

  return (
    <>
      <div className="py-8 max-w-container-max mx-auto px-md md:px-lg min-h-screen">

<section className="mt-lg space-y-md">

{cartItems.length === 0 ? (
  <div className="text-center py-12">
    <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">shopping_cart</span>
    <p className="text-on-surface-variant font-body-md">Your cart is empty.</p>
  </div>
) : cartItems.map(item => (
<div key={item.id} className="bg-surface-container-lowest p-md rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center gap-md transition-all duration-300 hover:shadow-lg border border-transparent hover:border-surface-variant">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
            <img alt={item.product_name || 'Product'} className="w-full h-full object-cover" src={item.product_image || 'https://placehold.co/150'}/>
          </div>
          <div className="flex-grow">
            <h3 className="font-body-lg text-body-lg font-semibold text-on-surface">{item.product_name}</h3>
            <p className="text-on-surface-variant font-body-md">₹{(item.product_price || 0).toFixed(2)} / {item.productUnit || item.product_unit || 'pc'}</p>
          </div>
<div className="flex items-center bg-surface-container-low rounded-full px-xs py-1 border border-outline-variant/30">
<button onClick={() => { if (item.quantity === 1) removeFromCart(item.id); else updateQuantity(item.id, item.quantity - 1); }} aria-label="Decrease quantity" className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container-high rounded-full transition-colors">
<span className="material-symbols-outlined text-[18px]">remove</span>
</button>
<span className="w-8 text-center font-semibold text-body-md">{item.quantity}</span>
<button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label="Increase quantity" className="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container-high rounded-full transition-colors">
<span className="material-symbols-outlined text-[18px]">add</span>
</button>
</div>
</div>
))}
</section>

<section className="mt-2xl space-y-lg">
<div className="flex items-center gap-md">
<div className="h-px flex-grow bg-outline-variant"></div>
<h2 className="font-title-md text-title-md text-on-surface whitespace-nowrap">Order Summary</h2>
<div className="h-px flex-grow bg-outline-variant"></div>
</div>
<div className="bg-surface-container p-lg rounded-xl space-y-md shadow-sm border border-surface-variant/50">
<div className="flex justify-between items-center text-body-lg font-body-lg">
<span className="text-on-surface-variant">Subtotal</span>
<span className="font-semibold">₹{cartTotal?.toFixed(2) || '0.00'}</span>
</div>
<div className="pt-md border-t border-outline-variant flex justify-between items-center">
<span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Total</span>
<span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">₹{cartTotal?.toFixed(2) || '0.00'}</span>
</div>
</div>
</section>

<section className="mt-lg">
<div className="bg-primary-fixed/20 p-md rounded-xl border border-primary-fixed flex items-center gap-md">
<span className="material-symbols-outlined text-primary" data-icon="store">store</span>
<p className="text-on-surface-variant font-body-md">Pickup in store. Pay directly at the shop when you collect your items.</p>
</div>
</section>
</div>

<div className="fixed bottom-[68px] left-0 w-full p-md bg-surface/90 backdrop-blur-md z-40 border-t border-surface-variant/30 flex flex-col justify-center items-center gap-sm">
<button onClick={() => navigate('/checkout')} className="w-full max-w-container-max bg-trust-blue hover:bg-primary-container text-on-primary font-title-md py-lg rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-md">
<span>Proceed to Checkout</span>
<span className="material-symbols-outlined">arrow_forward</span>
</button>
<button onClick={() => navigate('/shop-details')} className="text-primary font-body-md hover:underline">
Continue Shopping
</button>
</div>




    </>
  );
}
