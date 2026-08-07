import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

export default function CheckoutWithConfirmationPopup() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [orderId, setOrderId] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');

  const handlePlaceOrder = () => {
    setStep(1);
  };

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      const shopId = cartItems?.length > 0 ? (cartItems[0].shop_id || cartItems[0].shopId) : '';
      const orderItems = (cartItems || []).map(item => ({
        product_id: item.product_id,
        name: item.product_name || item.name || '',
        price: item.product_price || item.price || 0,
        quantity: item.quantity || 1,
        image: item.product_image || item.image || ''
      }));

      const res = await api.post('/api/orders/', {
        pickup_date: pickupDate || new Date().toISOString().split('T')[0],
        pickup_time: pickupTime || '12:00 PM',
        notes: '',
        shopId: shopId,
        items: orderItems,
        totalAmount: cartTotal || 0,
        orderType: "pickup"
      });
      const data = res.data;
      const code = data.pickupCode || data.pickup_code || data.orderCode || data.order_code || '';
      const id = data.orderId || data.order_id || '';
      setOrderCode(code);
      setOrderId(id);
      clearCart();
      setStep(2);
    } catch (error) {
      const errMsg = error.response?.data?.detail || 'Failed to place order. Please try again.';
      alert(errMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="font-body-md text-body-md selection:bg-primary-fixed selection:text-primary bg-background min-h-screen">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md flex items-center justify-between px-md h-14">
        <button onClick={() => navigate('/cart')} aria-label="Go back" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-200">
          <span className="material-symbols-outlined text-primary" data-icon="arrow_back">arrow_back</span>
        </button>
        <h1 className="font-title-md text-title-md text-primary">Checkout</h1>
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors active:scale-95 duration-200">
          <span className="material-symbols-outlined text-primary" data-icon="more_vert">more_vert</span>
        </button>
      </header>

      <main className="pt-20 pb-32 px-gutter max-w-lg mx-auto space-y-lg">
        {cartItems?.length > 0 && !cartItems[0].shop_id && !cartItems[0].shopId && (
          <section className="p-md bg-error-container text-on-error-container rounded-xl shadow-lg space-y-sm">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-error">warning</span>
              <p className="font-title-md font-bold">Invalid Cart</p>
            </div>
            <p className="text-body-md">Cart data is outdated or missing shop information. Please clear cart and add products again.</p>
            <button 
              onClick={clearCart}
              className="mt-2 w-full h-10 bg-error text-white rounded-lg font-label-lg active:scale-95 transition-all"
            >
              Clear Cart
            </button>
          </section>
        )}

        {/* Section 1: Pickup Time */}
        <section className="space-y-md">
          <h2 className="font-title-md text-title-md text-on-surface">Pickup Time</h2>
          <div className="grid grid-cols-2 gap-md">
            <div className="space-y-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Date</label>
              <input
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                className="w-full h-12 px-md rounded-xl border-border-gray bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="e.g. 25-12-2023"
                type="date"
              />
            </div>
            <div className="space-y-xs">
              <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Time (12-hour)</label>
              <input
                value={pickupTime}
                onChange={e => setPickupTime(e.target.value)}
                className="w-full h-12 px-md rounded-xl border-border-gray bg-surface-container-lowest focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="e.g. 05:30 PM"
                type="text"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Order Review */}
        <section className="space-y-md">
          <div className="flex justify-between items-center">
            <h2 className="font-title-md text-title-md text-on-surface">Order Review</h2>
            <span className="text-primary font-label-sm text-label-sm">{cartItems?.length || 0} items</span>
          </div>
          <div className="space-y-sm">
            {cartItems?.map(item => (
              <div key={item.id} className="flex items-center gap-md p-sm bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container">
                <img className="w-20 h-20 rounded-lg object-cover" src={item.product_image || 'https://placehold.co/150'} alt={item.product_name || 'Product'}/>
                <div className="flex-1">
                  <h3 className="font-title-md text-body-lg text-on-surface leading-tight">{item.product_name}</h3>
                  <p className="text-on-surface-variant text-label-sm">Qty: {item.quantity} {(item.productUnit || item.product_unit) === 'pc' ? (item.quantity > 1 ? 'pcs' : 'pc') : (item.productUnit || item.product_unit || 'pc')}</p>
                  <p className="text-trust-blue font-bold">₹{(item.product_price || 0).toFixed(2)} / {item.productUnit || item.product_unit || 'pc'}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Payment Method */}
        <section className="space-y-md">
          <h2 className="font-title-md text-title-md text-on-surface">Payment Method</h2>
          <div className="p-md bg-success-container text-on-success-container rounded-xl shadow-lg flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-md">
              <div className="w-12 h-8 bg-success-green text-white rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
              <div>
                <p className="font-title-md text-body-lg font-bold">Pay on Pickup</p>
                <p className="text-on-success-container/80 text-label-sm">Payment will be handled directly at the shop during pickup.</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-success-green" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
        </section>

        {/* Section 4: Order Summary */}
        <section className="p-lg bg-surface-container-low rounded-2xl space-y-sm border border-surface-container-high">
          <h2 className="font-title-md text-title-md text-on-surface pb-base border-b border-outline-variant">Summary</h2>
          <div className="flex justify-between text-body-md text-on-surface-variant">
            <span>Subtotal</span>
            <span>₹{cartTotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between text-body-md text-on-surface-variant">
            <span>Taxes</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between text-body-md text-on-surface-variant">
            <span>Service Fee</span>
            <span>₹0.00</span>
          </div>
          <div className="flex justify-between items-center pt-md mt-md border-t-2 border-dashed border-outline-variant">
            <span className="font-bold text-headline-lg-mobile text-on-surface">Total</span>
            <span className="font-bold text-headline-lg-mobile text-primary">₹{cartTotal?.toFixed(2) || '0.00'}</span>
          </div>
        </section>
      </main>

      {/* Bottom Action Area */}
      <div className="fixed bottom-[68px] w-full p-gutter bg-surface/80 backdrop-blur-md z-40 border-t border-outline-variant/30">
        <button 
          onClick={handlePlaceOrder}
          disabled={isProcessing || (cartItems?.length > 0 && !cartItems[0].shop_id && !cartItems[0].shopId)}
          className="w-full h-14 bg-primary text-on-primary rounded-xl font-title-md text-title-md shadow-lg flex items-center justify-center gap-sm active:scale-95 transition-all hover:bg-primary-container disabled:opacity-80"
        >
          Place Order
          <span className="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>
        </button>
      </div>

      {/* Checkout with Confirmation Popup */}
      {step === 1 && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-gutter">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !isProcessing && setStep(0)}></div>
          
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl p-xl shadow-2xl modal-animate-in text-center space-y-md animate-[modalIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Confirm Your Order</h3>
            <p className="text-body-md text-on-surface-variant">Are you ready to finalize your purchase of ₹{cartTotal?.toFixed(2) || '0.00'}?</p>
            
            <div className="flex flex-col gap-sm pt-md">
              <button 
                className="w-full h-12 bg-primary text-on-primary rounded-xl font-title-md text-body-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-xs" 
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Confirm"
                )}
              </button>
              <button 
                className="w-full h-12 bg-surface-container-high text-on-surface-variant rounded-xl font-title-md text-body-lg active:scale-95 transition-all" 
                onClick={() => !isProcessing && setStep(0)}
                disabled={isProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmed Popup */}
      {step === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-gutter">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={() => setStep(0)}></div>
          
          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl p-xl shadow-2xl modal-animate-in text-center space-y-lg animate-[modalIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-20 h-20 bg-success-green/10 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-success-green text-5xl" style={{ fontVariationSettings: "'wght' 600" }}>check_circle</span>
            </div>
            <div className="space-y-sm">
              <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Order Confirmed!</h3>
              <p className="text-body-md text-on-surface-variant">Your order has been placed successfully.</p>
              <div className="bg-surface-container py-3 px-4 rounded-xl inline-block mt-2">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Order Code</p>
                <p className="font-title-lg text-primary text-2xl tracking-[0.2em] font-bold">{orderCode}</p>
              </div>
              <p className="text-body-md text-on-surface-variant mt-2">You can track your order status in the orders section.</p>
            </div>
            <div className="flex flex-col gap-sm pt-md">
              <button className="w-full h-12 bg-primary text-on-primary rounded-xl font-title-md text-body-lg shadow-lg active:scale-95 transition-all" onClick={() => navigate(`/track-order?id=${orderId}`)}>
                Track Order
              </button>
              <button className="w-full h-12 bg-surface-container-high text-on-surface-variant rounded-xl font-title-md text-body-lg active:scale-95 transition-all" onClick={() => navigate('/')}>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
