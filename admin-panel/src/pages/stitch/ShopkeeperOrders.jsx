import { useAppContext } from '../../context/AppContext';
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return dateStr;
  }
};

const SkeletonCard = () => (
  <div className="bg-surface-container-lowest p-md rounded-xl border-t-4 border-outline-variant shadow-sm animate-pulse">
    <div className="flex justify-between items-start mb-sm">
      <div className="space-y-xs">
        <div className="h-4 w-16 bg-outline-variant rounded"></div>
        <div className="h-6 w-24 bg-outline-variant rounded mt-xs"></div>
      </div>
      <div className="h-4 w-20 bg-outline-variant rounded"></div>
    </div>
    <div className="flex items-center gap-md py-md border-y border-border-gray mb-md">
      <div className="w-12 h-12 rounded-full bg-outline-variant"></div>
      <div className="space-y-xs flex-1">
        <div className="h-4 w-32 bg-outline-variant rounded"></div>
        <div className="h-3 w-24 bg-outline-variant rounded"></div>
      </div>
    </div>
    <div className="h-10 bg-outline-variant rounded-lg w-full"></div>
  </div>
);

export default function ShopkeeperOrders() {
  const { setIsShopkeeperMode } = useAppContext();
  const location = useLocation();
  const navigate = useNavigate();
  const handleAlert = (msg) => {
    console.log("Action triggered:", msg);
  };
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [orders, setOrders] = useState([]);


  const mapApiOrderToFrontend = (apiOrder) => {
    let status = 'New';
    let statusLabel = 'New Order';
    let statusBadge = 'bg-secondary-fixed text-on-secondary-fixed';
    let borderClass = 'border-marketplace-orange shadow-sm';

    const backendStatus = apiOrder.orderStatus ? apiOrder.orderStatus.toLowerCase() : 'placed';

    if (backendStatus === 'placed') {
      status = 'New';
      statusLabel = 'New Order';
      statusBadge = 'bg-secondary-fixed text-on-secondary-fixed';
      borderClass = 'border-marketplace-orange shadow-sm';
    } else if (backendStatus === 'accepted' || backendStatus === 'preparing') {
      status = 'Active';
      statusLabel = 'Preparing';
      statusBadge = 'bg-surface-container text-trust-blue';
      borderClass = 'border-trust-blue shadow-sm';
    } else if (backendStatus === 'ready_for_pickup') {
      status = 'Completed';
      statusLabel = 'Ready for Pickup';
      statusBadge = 'bg-tertiary-fixed text-on-tertiary-fixed-variant';
      borderClass = 'border-success-green shadow-sm';
    } else if (backendStatus === 'picked_up' || backendStatus === 'delivered' || backendStatus === 'completed') {
      status = 'Completed';
      statusLabel = 'Completed';
      statusBadge = 'bg-success-container text-on-success-container';
      borderClass = 'border-success-green shadow-sm';
    } else if (backendStatus === 'cancelled' || backendStatus === 'canceled') {
      status = 'Cancelled';
      statusLabel = 'Cancelled';
      statusBadge = 'bg-outline-variant text-on-surface-variant';
      borderClass = 'border-outline opacity-60 shadow-sm';
    }

    const timeFormatted = formatRelativeTime(apiOrder.createdAt);
    const itemCount = apiOrder.items ? apiOrder.items.reduce((acc, it) => acc + (it.quantity || 0), 0) : 0;

    return {
      id: apiOrder.id,
      displayId: `#GP-${apiOrder.id.slice(-4).toUpperCase()}`,
      status,
      statusBadge,
      statusLabel,
      time: timeFormatted,
      customer: apiOrder.customerName || 'Customer',
      image: apiOrder.items?.[0]?.image || '',
      items: `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
      total: `₹${parseFloat(apiOrder.totalAmount || 0).toFixed(2)}`,
      borderClass,
      productsList: (apiOrder.items || []).map(item => {
        const u = item.unit || item.productUnit || item.product_unit || 'pc';
        return {
          name: item.name,
          quantity: item.quantity,
          price: `₹${parseFloat(item.price || 0).toFixed(2)} / ${u}`,
          unit: u
        };
      }),
      raw: apiOrder
    };
  };

  const fetchOrders = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await api.get('/api/shopkeeper/orders');
      if (res.data && res.data.success) {
        if (res.data.orders && res.data.orders.length > 0) {
          const mapped = res.data.orders.map(mapApiOrderToFrontend);
          setOrders(mapped);
        } else {
          setOrders([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch shopkeeper orders:", err);
      setErrorMessage("Failed to load live orders.");
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
  }, []);

  const filteredOrders = orders.filter(o => 
    (activeTab === 'All' || o.status === activeTab) && 
    (o.id.toLowerCase().includes(search.toLowerCase()) || 
     o.displayId?.toLowerCase().includes(search.toLowerCase()) || 
     o.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const acceptOrder = async (id) => {
    try {
      // Transition from placed to accepted
      await api.put(`/api/shopkeeper/orders/${id}/status`, { status: 'accepted' });
      // Transition from accepted to preparing
      await api.put(`/api/shopkeeper/orders/${id}/status`, { status: 'preparing' });
      fetchOrders(false);
    } catch (err) {
      console.error("Failed to accept order:", err);
      setErrorMessage(err.response?.data?.detail || "Failed to accept order");
    }
  };

  const markReady = async (id) => {
    try {
      const targetOrder = orders.find(o => o.id === id);
      const isDelivery = targetOrder?.raw?.orderType === 'delivery';
      const nextStatus = isDelivery ? 'out_for_delivery' : 'ready_for_pickup';
      
      await api.put(`/api/shopkeeper/orders/${id}/status`, { status: nextStatus });
      fetchOrders(false);
    } catch (err) {
      console.error("Failed to mark order as ready:", err);
      setErrorMessage(err.response?.data?.detail || "Failed to update status");
    }
  };

  const completeHandover = async (id) => {
    const pickupCode = prompt("Please enter the customer's 6-character pickup code to finalize the handover:");
    if (pickupCode === null) {
      return; // User cancelled the prompt
    }
    const trimmedCode = pickupCode.trim();
    if (trimmedCode.length !== 6) {
      setErrorMessage("Invalid pickup code. The code must be exactly 6 characters.");
      return;
    }

    try {
      await api.post(`/api/shopkeeper/orders/${id}/verify-code`, { pickupCode: trimmedCode.toUpperCase() });
      fetchOrders(false);
    } catch (err) {
      console.error("Failed to complete handover:", err);
      setErrorMessage(err.response?.data?.detail || "Failed to complete handover");
    }
  };


  const renderCardButtons = (order) => {
    if (order.statusLabel === 'New Order') {
      return (
        <div className="flex flex-col gap-xs">
          <button className="w-full py-sm bg-marketplace-orange text-on-primary rounded-lg font-label-sm hover:brightness-110 active:scale-[0.98] transition-all" onClick={() => acceptOrder(order.id)}>Accept Order</button>
          <button className="w-full py-sm bg-surface-container text-marketplace-orange rounded-lg font-label-sm hover:bg-secondary-fixed active:scale-[0.98] transition-all" onClick={() => handleAlert("Contacting customer...")}>Contact Customer</button>
        </div>
      );
    } else if (order.statusLabel === 'Preparing') {
      return (
        <div className="flex flex-col gap-xs">
          <button className="w-full py-sm bg-trust-blue text-on-primary rounded-lg font-label-sm hover:brightness-110 active:scale-[0.98] transition-all" onClick={() => markReady(order.id)}>Mark as Ready</button>
          <button className="w-full py-sm bg-surface-container text-trust-blue rounded-lg font-label-sm hover:bg-surface-container-highest active:scale-[0.98] transition-all" onClick={() => setSelectedOrder(order)}>View Details</button>
        </div>
      );
    } else if (order.statusLabel === 'Ready for Pickup') {
      return (
        <div className="flex flex-col gap-xs">
          <button className="w-full py-sm bg-success-green text-on-primary rounded-lg font-label-sm hover:brightness-110 active:scale-[0.98] transition-all" onClick={() => completeHandover(order.id)}>Complete Handover</button>
          <div className="flex gap-xs">
            <button className="flex-1 py-sm bg-surface-container text-on-surface-variant rounded-lg font-label-sm hover:bg-surface-container-highest transition-all flex items-center justify-center gap-xs" onClick={() => handleAlert("Messaging...")}><span className="material-symbols-outlined text-sm">chat</span> Message</button>
            <button className="flex-1 py-sm bg-surface-container text-on-surface-variant rounded-lg font-label-sm hover:bg-surface-container-highest transition-all flex items-center justify-center gap-xs" onClick={() => handleAlert("Calling...")}><span className="material-symbols-outlined text-sm">call</span> Call</button>
          </div>
        </div>
      );
    } else {
      return (
        <button className="w-full py-sm border border-outline text-on-surface-variant rounded-lg font-label-sm hover:bg-surface-container-highest transition-all" onClick={() => handleAlert("Viewing reason...")}>View Reason</button>
      );
    }
  };

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface dark:bg-surface-dim shadow-sm flex items-center justify-between px-md h-16 w-full">
        <div className="flex items-center gap-md">
          <button className="material-symbols-outlined text-marketplace-orange text-2xl mr-2" onClick={() => navigate('/shopkeeper')}>arrow_back</button>
          <span className="material-symbols-outlined text-marketplace-orange text-2xl" data-icon="storefront">storefront</span>
          <h1 className="font-title-md text-title-md text-marketplace-orange font-bold">Shop Management</h1>
        </div>
        <div className="flex items-center gap-sm">
          <button className="hidden md:flex items-center px-md py-xs rounded-full border border-outline text-on-surface-variant font-label-sm hover:bg-surface-container-high transition-colors" onClick={() => { setIsShopkeeperMode(false); navigate('/'); }}>
            Switch to Customer
          </button>
          <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed font-bold cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/shopkeeper/profile")}>
            JD
          </div>
        </div>
      </header>
      <main className="pt-20 px-md max-w-container-max mx-auto mb-2xl">
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
          <div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface font-bold">Order Management</h2>
            <p className="text-on-surface-variant font-body-md">Real-time update of your shop performance</p>
          </div>
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" data-icon="search">search</span>
            <input className="w-full pl-11 pr-md py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange transition-all placeholder:text-on-surface-variant/50" placeholder="Search Order ID or Customer..." type="text" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </section>

        <div className="flex gap-xs mb-lg overflow-x-auto no-scrollbar pb-xs">
          <button className={`px-lg py-sm rounded-full font-label-sm whitespace-nowrap active:scale-95 transition-transform ${activeTab === 'All' ? 'bg-marketplace-orange text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} onClick={() => setActiveTab('All')}>
            All ({orders.length})
          </button>
          <button className={`px-lg py-sm rounded-full font-label-sm whitespace-nowrap active:scale-95 transition-transform ${activeTab === 'New' ? 'bg-marketplace-orange text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} onClick={() => setActiveTab('New')}>
            New ({orders.filter(o => o.status === 'New').length})
          </button>
          <button className={`px-lg py-sm rounded-full font-label-sm whitespace-nowrap active:scale-95 transition-transform ${activeTab === 'Active' ? 'bg-marketplace-orange text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} onClick={() => setActiveTab('Active')}>
            Active ({orders.filter(o => o.status === 'Active').length})
          </button>
          <button className={`px-lg py-sm rounded-full font-label-sm whitespace-nowrap active:scale-95 transition-transform ${activeTab === 'Completed' ? 'bg-marketplace-orange text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} onClick={() => setActiveTab('Completed')}>
            Completed ({orders.filter(o => o.status === 'Completed').length})
          </button>
          <button className={`px-lg py-sm rounded-full font-label-sm whitespace-nowrap active:scale-95 transition-transform ${activeTab === 'Cancelled' ? 'bg-marketplace-orange text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} onClick={() => setActiveTab('Cancelled')}>
            Cancelled ({orders.filter(o => o.status === 'Cancelled').length})
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : errorMessage ? (
          <div>
            <div className="bg-warning-amber/10 border border-warning-amber/20 text-warning-amber p-md rounded-xl mb-md font-body-md flex items-center gap-sm">
              <span className="material-symbols-outlined">warning</span>
              <span>{errorMessage}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
              {filteredOrders.map(order => (
                <div key={order.id} className={`bg-surface-container-lowest p-md rounded-xl border-t-4 ${order.borderClass} order-card-transition`}>
                  <div className="flex justify-between items-start mb-sm">
                    <div>
                      <span className={`${order.statusBadge} px-xs py-1 rounded-md font-label-sm uppercase tracking-wider`}>{order.statusLabel}</span>
                      <h3 className="font-title-md text-title-md mt-xs">{order.displayId}</h3>
                    </div>
                    <span className="text-on-surface-variant font-label-sm flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm" data-icon="schedule">schedule</span>
                      {order.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-md py-md border-y border-border-gray mb-md">
                    {order.image ? (
                      <img className="w-12 h-12 rounded-full object-cover" src={order.image} alt={order.customer} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-outline-variant flex items-center justify-center text-on-surface">
                        <span className="material-symbols-outlined" data-icon="person">person</span>
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-on-surface">{order.customer}</p>
                      <p className="text-on-surface-variant font-body-md text-sm flex items-center gap-2">
                        <span>{order.items} • {order.total}</span>
                        <button onClick={() => setSelectedOrder(order)} className="text-marketplace-orange hover:underline text-[12px] font-bold bg-marketplace-orange/10 px-2 py-0.5 rounded">View Items</button>
                      </p>
                    </div>
                  </div>
                  {renderCardButtons(order)}
                </div>
              ))}
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full py-2xl text-center flex flex-col items-center justify-center bg-surface-container-lowest p-xl rounded-xl border border-outline-variant shadow-sm min-h-[300px]">
            <span className="material-symbols-outlined text-[64px] text-on-surface-variant/40 mb-md">shopping_bag</span>
            <h3 className="font-title-lg text-on-surface font-bold">No pickup orders yet.</h3>
            <p className="text-on-surface-variant font-body-md max-w-sm mt-xs">
              {search ? "No orders match your search query." : "There are currently no orders in this tab."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {filteredOrders.map(order => (
              <div key={order.id} className={`bg-surface-container-lowest p-md rounded-xl border-t-4 ${order.borderClass} order-card-transition`}>
                <div className="flex justify-between items-start mb-sm">
                  <div>
                    <span className={`${order.statusBadge} px-xs py-1 rounded-md font-label-sm uppercase tracking-wider`}>{order.statusLabel}</span>
                    <h3 className="font-title-md text-title-md mt-xs">{order.displayId}</h3>
                  </div>
                  <span className="text-on-surface-variant font-label-sm flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm" data-icon="schedule">schedule</span>
                    {order.time}
                  </span>
                </div>
                <div className="flex items-center gap-md py-md border-y border-border-gray mb-md">
                  {order.image ? (
                    <img className="w-12 h-12 rounded-full object-cover" src={order.image} alt={order.customer} />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-outline-variant flex items-center justify-center text-on-surface">
                      <span className="material-symbols-outlined" data-icon="person">person</span>
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-on-surface">{order.customer}</p>
                    <p className="text-on-surface-variant font-body-md text-sm flex items-center gap-2">
                      <span>{order.items} • {order.total}</span>
                      <button onClick={() => setSelectedOrder(order)} className="text-marketplace-orange hover:underline text-[12px] font-bold bg-marketplace-orange/10 px-2 py-0.5 rounded">View Items</button>
                    </p>
                  </div>
                </div>
                {renderCardButtons(order)}
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="px-6 py-4 border-b border-border-gray flex justify-between items-center bg-surface-slate">
              <h3 className="font-title-lg text-on-surface">Order Details ({selectedOrder.displayId})</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-on-surface-variant hover:text-error-red transition-colors material-symbols-outlined">close</button>
            </div>
            <div className="p-6 space-y-md">
              <div className="bg-surface-slate p-md rounded-xl space-y-xs border border-border-gray mb-md text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Customer Mobile:</span>
                  <span className="text-on-surface font-bold">{selectedOrder.raw?.customerPhone || selectedOrder.raw?.customer_phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant font-medium">Order Code (Pickup):</span>
                  <span className="text-on-surface font-bold tracking-wider">{selectedOrder.raw?.pickupCode || selectedOrder.raw?.pickup_code || 'N/A'}</span>
                </div>
              </div>
              {selectedOrder.productsList ? selectedOrder.productsList.map((prod, idx) => (
                <div key={idx} className="flex justify-between items-center border-b border-border-gray pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-container rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline">shopping_bag</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">{prod.name}</p>
                      <p className="text-xs text-on-surface-variant">Qty: {prod.quantity} {prod.unit === 'pc' ? (prod.quantity > 1 ? 'pcs' : 'pc') : prod.unit}</p>
                    </div>
                  </div>
                  <span className="font-bold text-on-surface">{prod.price}</span>
                </div>
              )) : (
                <div className="flex justify-between items-center border-b border-border-gray pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-container rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline">shopping_bag</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-on-surface">Various Items</p>
                      <p className="text-xs text-on-surface-variant">Qty: {selectedOrder.items.split(' ')[0]}</p>
                    </div>
                  </div>
                  <span className="font-bold text-on-surface">{selectedOrder.total}</span>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-surface-container-lowest border-t border-border-gray flex justify-end">
              <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg font-label-sm transition-colors text-on-surface">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
