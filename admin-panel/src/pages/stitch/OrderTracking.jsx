import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { openWhatsApp, buildOrderMessage, resolveShopPhone } from '../../utils/contactUtils';

export default function OrderTracking() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('id');

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contactMsg, setContactMsg] = useState('');
  const [resolvedPhone, setResolvedPhone] = useState('');

  useEffect(() => {
    if (!orderId) {
      setIsLoading(false);
      return;
    }
    api.get(`/api/orders/${orderId}`)
      .then(res => {
        if (res.data?.success && res.data?.order) {
          setOrder(res.data.order);
        }
      })
      .catch(err => console.error('Error fetching order details:', err))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const displayOrder = order;

  const showContactMsg = (msg) => {
    setContactMsg(msg);
    setTimeout(() => setContactMsg(''), 4000);
  };

  const handleCallShop = async () => {
    const phone = await resolveShopPhone(displayOrder, displayOrder?.shopId, setResolvedPhone);
    if (!phone) {
      showContactMsg('Shopkeeper phone number is not available.');
      return;
    }
    window.location.href = 'tel:' + phone;
  };

  const handleMessageShop = async () => {
    const phone = await resolveShopPhone(displayOrder, displayOrder?.shopId, setResolvedPhone);
    if (!phone) {
      showContactMsg('Shopkeeper phone number is not available.');
      return;
    }
    const currentOrderId = displayOrder?.id || displayOrder?.orderId || '';
    const message = buildOrderMessage(currentOrderId);
    openWhatsApp(phone, message);
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-on-surface-variant">Loading order details...</div>;
  if (!displayOrder) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-md px-lg text-center">
      <span className="material-symbols-outlined text-5xl text-outline">receipt_long</span>
      <h2 className="font-title-md text-on-surface">Order not found</h2>
      <p className="text-on-surface-variant">This order may have been removed or you may not have access.</p>
      <button onClick={() => navigate('/orders')} className="mt-md px-lg py-sm bg-primary text-on-primary rounded-xl">View My Orders</button>
    </div>
  );

  const status = displayOrder.orderStatus?.toLowerCase() || 'placed';

  const getStepState = (stepIndex) => {
    // stepIndex: 1 = Placed, 2 = Preparing, 3 = Ready for Pickup, 4 = Picked Up / Completed
    if (status === 'cancelled' || status === 'canceled') {
      return 'canceled';
    }
    
    const statusOrder = ['placed', 'preparing', 'ready_for_pickup', 'picked_up', 'completed', 'delivered'];
    const currentIdx = statusOrder.indexOf(status);
    
    const stepTargetIdx = stepIndex - 1;
    if (stepIndex === 4) {
      if (currentIdx >= 3) return 'completed';
      return 'upcoming';
    }
    
    if (currentIdx > stepTargetIdx) {
      return 'completed';
    } else if (currentIdx === stepTargetIdx) {
      return 'active';
    } else {
      return 'upcoming';
    }
  };

  const renderStep = (stepIndex, title, activeDesc, upcomingDesc, completedDesc) => {
    const state = getStepState(stepIndex);
    
    let bullet = null;
    let titleClass = "font-title-md text-body-lg font-bold text-outline";
    let desc = upcomingDesc;
    let descClass = "font-body-md text-body-md text-outline";
    
    if (state === 'completed') {
      bullet = (
        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-trust-blue text-white ring-4 ring-surface-container-lowest">
          <span className="material-symbols-outlined text-sm" data-icon="check" style={{'fontVariationSettings': "'FILL' 1"}}>check</span>
        </div>
      );
      titleClass = "font-title-md text-body-lg font-bold text-on-surface";
      desc = completedDesc;
      descClass = "font-body-md text-body-md text-on-surface-variant";
    } else if (state === 'active') {
      bullet = (
        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-trust-blue ring-4 ring-surface-container-lowest">
          <div className="absolute w-full h-full rounded-full bg-trust-blue/40 animate-pulse-ring"></div>
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
      );
      titleClass = "font-title-md text-body-lg font-bold text-trust-blue";
      desc = activeDesc;
      descClass = "font-body-md text-body-md text-on-surface";
    } else if (state === 'canceled') {
      bullet = (
        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-error-red text-white ring-4 ring-surface-container-lowest">
          <span className="material-symbols-outlined text-sm" data-icon="close">close</span>
        </div>
      );
      titleClass = "font-title-md text-body-lg font-bold text-error-red";
      desc = "This order was canceled";
      descClass = "font-body-md text-body-md text-error-red/80";
    } else {
      bullet = (
        <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-border-gray ring-4 ring-surface-container-lowest">
          <div className="w-2 h-2 rounded-full bg-white"></div>
        </div>
      );
    }
    
    return (
      <div className="relative flex items-start gap-lg pb-8">
        {bullet}
        <div>
          <h3 className={titleClass}>{title}</h3>
          <p className={descClass}>{desc}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 px-md max-w-2xl mx-auto min-h-screen">
      {isLoading ? (
        <div className="text-center text-on-surface-variant pt-12">Loading tracking details...</div>
      ) : (
        <div className="space-y-lg">
          {/* Live Status Tracker Card */}
          <section className="bg-surface-container-lowest rounded-xl p-lg shadow-sm">
            <div className="flex items-center justify-between mb-xl">
              <div>
                <h2 className="font-title-md text-title-md text-trust-blue mb-1">Estimated Pickup Time</h2>
                <p className="font-headline-lg text-headline-lg text-on-surface">{displayOrder.pickupTime || '25 min'}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-sm py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider ${
                  status === 'cancelled' || status === 'canceled' ? 'bg-error-red/10 text-error-red' :
                  status === 'completed' || status === 'delivered' ? 'bg-success-green/10 text-success-green' :
                  'bg-surface-container-high text-trust-blue'
                }`}>
                  {status === 'cancelled' || status === 'canceled' ? 'Canceled' :
                   status === 'completed' || status === 'delivered' ? 'Completed' :
                   status === 'ready_for_pickup' ? 'Ready for Pickup' :
                   status === 'preparing' ? 'Preparing' : 'Placed'}
                </span>
              </div>
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-0 relative ml-4">
              {/* Line */}
              <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-border-gray"></div>
              
              {/* Step 1: Placed */}
              {renderStep(
                1, 
                "Order Placed", 
                "Your order is currently being reviewed by the shop", 
                "Waiting to receive order", 
                "Your order has been received successfully"
              )}

              {/* Step 2: Preparing */}
              {renderStep(
                2, 
                "Preparing", 
                "The kitchen is preparing your ordered items", 
                "Waiting for preparation to start", 
                "Preparation complete"
              )}

              {/* Step 3: Ready for Pickup */}
              {renderStep(
                3, 
                "Ready for Pickup", 
                "Your order is ready and waiting for you", 
                "Waiting for final packaging and checks", 
                "Ready for collection"
              )}

              {/* Step 4: Final Handover */}
              {renderStep(
                4, 
                "Picked Up & Completed", 
                "Handing over items to you", 
                "Waiting for handover", 
                "Successfully collected. Enjoy!"
              )}
            </div>
          </section>

          {/* Shop Contact Section */}
          <section className="bg-surface-container-lowest rounded-xl p-md shadow-sm border border-surface-container flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-md">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container flex-shrink-0">
                  <img alt={displayOrder.shopName} className="w-full h-full object-cover" src={displayOrder.shopImageUrl || (displayOrder.items && displayOrder.items[0]?.image) || "https://placehold.co/150"}/>
                </div>
                <div>
                  <h4 className="font-title-md text-body-lg font-bold text-on-surface">{displayOrder.shopName}</h4>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    {displayOrder.businessPhone ? displayOrder.businessPhone : 'Active Shop'}
                  </p>
                </div>
              </div>
              <div className="flex gap-sm">
                <button
                  title="Call shop"
                  className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-trust-blue hover:bg-surface-container-high transition-colors active:scale-90"
                  onClick={handleCallShop}
                >
                  <span className="material-symbols-outlined" data-icon="call">call</span>
                </button>
                <button
                  title="Message shop"
                  className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-trust-blue hover:bg-surface-container-high transition-colors active:scale-90"
                  onClick={handleMessageShop}
                >
                  <span className="material-symbols-outlined" data-icon="chat">chat</span>
                </button>
              </div>
            </div>
            {contactMsg && (
              <p className="text-xs text-center font-semibold text-warning-amber bg-amber-50 rounded-lg py-1 px-2">{contactMsg}</p>
            )}
          </section>

          {/* Receipt Breakdown Card */}
          <section className="bg-white rounded-xl shadow-md overflow-hidden border border-border-gray">
            <div className="bg-surface-container-low px-lg py-md border-b border-border-gray flex justify-between items-center">
              <span className="font-title-md text-body-lg font-bold text-on-surface">Receipt</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {displayOrder.createdAt ? new Date(displayOrder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
              </span>
            </div>
            
            <div className="p-lg space-y-md">
              {/* Itemized List */}
              <div className="space-y-sm">
                {displayOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start">
                    <div className="flex gap-md">
                      <span className="font-label-sm text-label-sm text-trust-blue bg-surface-container px-2 py-0.5 rounded h-fit">
                        {item.quantity} {(item.unit || item.productUnit || item.product_unit) === 'pc' ? (item.quantity > 1 ? 'pcs' : 'pc') : (item.unit || item.productUnit || item.product_unit || 'pc')}
                      </span>
                      <div>
                        <h5 className="font-body-lg text-body-lg font-semibold">{item.name || item.productName || 'Product'}</h5>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">₹{(item.price || item.productPrice || 0).toFixed(2)} / {item.unit || item.productUnit || item.product_unit || 'pc'}</p>
                        {item.description && <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">{item.description}</p>}
                      </div>
                    </div>
                    <span className="font-body-lg text-body-lg font-semibold">₹{((item.price || item.productPrice || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-border-gray pt-md space-y-xs">
                <div className="flex justify-between text-on-surface-variant">
                  <span className="font-body-md text-body-md">Subtotal</span>
                  <span className="font-body-md text-body-md">₹{(displayOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span className="font-body-md text-body-md">Taxes</span>
                  <span className="font-body-md text-body-md">₹0.00</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span className="font-body-md text-body-md">Service Fee</span>
                  <span className="font-body-md text-body-md text-success-green">Free</span>
                </div>
              </div>

              {/* Total */}
              <div className="pt-sm border-t border-border-gray flex justify-between items-center">
                <span className="font-title-md text-on-surface">Total</span>
                <span className="font-headline-lg text-trust-blue">₹{(displayOrder.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-surface-slate px-lg py-md flex items-center justify-between border-t border-border-gray">
              <div className="flex items-center gap-sm text-on-surface-variant">
                <span className="material-symbols-outlined" data-icon="payments">payments</span>
                <span className="font-label-sm text-label-sm">Payment will be handled directly at the shop during pickup.</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
