import React from 'react';
import { SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView 
        source={{ html: `<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Go2Pick - Shopping Cart</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;family=Inter:wght@400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "surface-variant": "#d3e4fe",
                        "on-secondary": "#ffffff",
                        "primary-container": "#2563eb",
                        "outline": "#737686",
                        "tertiary-fixed": "#6ffbbe",
                        "primary": "#004ac6",
                        "error-container": "#ffdad6",
                        "inverse-surface": "#213145",
                        "on-tertiary-container": "#bdffdb",
                        "primary-fixed": "#dbe1ff",
                        "surface": "#f8f9ff",
                        "error-red": "#EF4444",
                        "on-tertiary-fixed-variant": "#005236",
                        "on-tertiary-fixed": "#002113",
                        "inverse-primary": "#b4c5ff",
                        "on-primary-fixed-variant": "#003ea8",
                        "marketplace-orange": "#F97316",
                        "surface-container-highest": "#d3e4fe",
                        "on-secondary-fixed-variant": "#783200",
                        "border-gray": "#E2E8F0",
                        "surface-slate": "#F8FAFC",
                        "on-secondary-fixed": "#341100",
                        "on-primary-container": "#eeefff",
                        "tertiary-container": "#007d55",
                        "secondary-fixed-dim": "#ffb690",
                        "background": "#f8f9ff",
                        "secondary-container": "#fd761a",
                        "primary-fixed-dim": "#b4c5ff",
                        "on-primary-fixed": "#00174b",
                        "tertiary-fixed-dim": "#4edea3",
                        "on-error-container": "#93000a",
                        "surface-tint": "#0053db",
                        "inverse-on-surface": "#eaf1ff",
                        "on-surface": "#0b1c30",
                        "secondary": "#9d4300",
                        "surface-container-lowest": "#ffffff",
                        "success-green": "#10B981",
                        "surface-container-high": "#dce9ff",
                        "warning-amber": "#F59E0B",
                        "on-background": "#0b1c30",
                        "outline-variant": "#c3c6d7",
                        "error": "#ba1a1a",
                        "on-secondary-container": "#5c2400",
                        "surface-container-low": "#eff4ff",
                        "on-primary": "#ffffff",
                        "on-surface-variant": "#434655",
                        "surface-bright": "#f8f9ff",
                        "on-tertiary": "#ffffff",
                        "surface-dim": "#cbdbf5",
                        "trust-blue": "#2563EB",
                        "surface-container": "#e5eeff",
                        "secondary-fixed": "#ffdbca",
                        "on-error": "#ffffff",
                        "tertiary": "#006242"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "xs": "8px",
                        "sm": "12px",
                        "2xl": "48px",
                        "xl": "32px",
                        "container-max": "1280px",
                        "base": "4px",
                        "md": "16px",
                        "lg": "24px",
                        "gutter": "16px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Plus Jakarta Sans"],
                        "title-md": ["Plus Jakarta Sans"],
                        "label-sm": ["Inter"],
                        "body-lg": ["Inter"],
                        "headline-lg-mobile": ["Plus Jakarta Sans"],
                        "display-lg": ["Plus Jakarta Sans"],
                        "body-md": ["Inter"]
                    },
                    "fontSize": {
                        "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                        "title-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                        "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                        "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "700"}],
                        "display-lg": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}]
                    }
                }
            }
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .blur-header {
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface font-body-md selection:bg-primary-fixed selection:text-on-primary-fixed">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm">
<div class="flex items-center justify-between px-md h-14 w-full">
<div class="flex items-center gap-md">
<button aria-label="Back" class="transition-colors duration-200 active:scale-95 hover:bg-surface-container-low p-2 rounded-full text-primary dark:text-inverse-primary">
<span class="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 class="font-title-md text-title-md text-primary dark:text-inverse-primary">Shopping Cart</h1>
</div>
<button aria-label="Clear Cart" class="transition-colors duration-200 active:scale-95 hover:bg-surface-container-low p-2 rounded-full text-primary dark:text-inverse-primary">
<span class="material-symbols-outlined" data-icon="delete">delete</span>
</button>
</div>
</header>
<main class="pt-14 pb-48 max-w-container-max mx-auto px-md md:px-lg">
<!-- Cart Items List -->
<section id="cart-items-container" class="mt-lg space-y-md">
  <div class="p-md text-on-surface-variant text-center py-xl">
    <span class="material-symbols-outlined text-4xl text-outline-variant mb-2">shopping_cart</span>
    <p>Loading cart...</p>
  </div>
</section>
<!-- Order Summary Section -->
<section class="mt-2xl space-y-lg">
<div class="flex items-center gap-md">
<div class="h-px flex-grow bg-outline-variant"></div>
<h2 class="font-title-md text-title-md text-on-surface whitespace-nowrap">Order Summary</h2>
<div class="h-px flex-grow bg-outline-variant"></div>
</div>
<div class="bg-surface-container p-lg rounded-xl space-y-md shadow-sm border border-surface-variant/50">
<div class="flex justify-between items-center text-body-lg font-body-lg">
<span class="text-on-surface-variant">Subtotal</span>
<span id="cart-subtotal" class="font-semibold">\$0.00</span>
</div>
<div class="flex justify-between items-center text-body-lg font-body-lg">
<span class="text-on-surface-variant">Pickup Fee</span>
<span class="font-semibold text-success-green">\$0.00</span>
</div>
<div class="pt-md border-t border-outline-variant flex justify-between items-center">
<span class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Total</span>
<span id="cart-total" class="font-headline-lg-mobile text-headline-lg-mobile text-primary">\$0.00</span>
</div>
</div>
</section>
<!-- Promo Banner -->
<section class="mt-lg">
<div class="bg-primary-fixed/20 p-md rounded-xl border border-primary-fixed flex items-center gap-md">
<span class="material-symbols-outlined text-primary" data-icon="storefront">storefront</span>
<p class="text-on-surface-variant font-body-md">Pre-order items and collect directly at the shop!</p>
</div>
</section>
</main>
<!-- Checkout Footer -->
<div class="fixed bottom-14 left-0 w-full p-md bg-surface/90 backdrop-blur-md z-40 border-t border-surface-variant/30 flex justify-center">
<button class="w-full max-w-container-max bg-trust-blue hover:bg-primary-container text-on-primary font-title-md py-lg rounded-xl shadow-lg transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-md">
<span>Proceed to Checkout</span>
<span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 w-full z-50 rounded-t-xl bg-surface dark:bg-on-background shadow-lg shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
<div class="flex justify-around items-center h-14 w-full px-lg pb-safe">
<!-- Shop -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant transition-transform duration-200 active:scale-95 hover:bg-surface-container-low">
<span class="material-symbols-outlined" data-icon="storefront">storefront</span>
<span class="font-label-sm text-label-sm">Shop</span>
</button>
<!-- Search -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant transition-transform duration-200 active:scale-95 hover:bg-surface-container-low">
<span class="material-symbols-outlined" data-icon="search">search</span>
<span class="font-label-sm text-label-sm">Search</span>
</button>
<!-- Orders -->
<button class="flex flex-col items-center justify-center text-on-surface-variant dark:text-outline-variant transition-transform duration-200 active:scale-95 hover:bg-surface-container-low">
<span class="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
<span class="font-label-sm text-label-sm">Orders</span>
</button>
<!-- Cart (Active) -->
<button class="flex flex-col items-center justify-center text-primary dark:text-inverse-primary font-bold transition-transform duration-200 active:scale-95 hover:bg-surface-container-low">
<span class="material-symbols-outlined" data-icon="shopping_cart" style="font-variation-settings: 'FILL' 1;">shopping_cart</span>
<span class="font-label-sm text-label-sm">Cart</span>
</button>
</div>
</nav>
<script>
        fetch('http://localhost:8000/api/customer/cart')
            .then(res => res.json())
            .then(cart => {
                const container = document.getElementById('cart-items-container');
                if (!container) return;
                
                if (!cart.items || cart.items.length === 0) {
                    container.innerHTML = '<div class="p-xl text-center"><span class="material-symbols-outlined text-6xl text-outline-variant mb-4">shopping_cart</span><p class="text-on-surface-variant text-lg">Your cart is empty.</p></div>';
                    return;
                }
                
                container.innerHTML = '';
                
                cart.items.forEach(item => {
                    const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
                    const imageUrl = item.image || fallbackImage;
                    const price = Number(item.price).toFixed(2);
                    
                    const itemHtml = \`
                    <div class="bg-surface-container-lowest p-md rounded-xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] flex items-center gap-md transition-all duration-300 hover:shadow-lg border border-transparent hover:border-surface-variant">
                        <div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container">
                            <img alt="\${item.name}" class="w-full h-full object-cover" src="\${imageUrl}" onerror="this.src='\${fallbackImage}'"/>
                        </div>
                        <div class="flex-grow">
                            <h3 class="font-body-lg text-body-lg font-semibold text-on-surface">\${item.name}</h3>
                            <p class="text-on-surface-variant font-body-md">₹\${price}</p>
                        </div>
                        <div class="flex items-center bg-surface-container-low rounded-full px-xs py-1 border border-outline-variant/30">
                            <button aria-label="Decrease quantity" class="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container-high rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                            <span class="w-8 text-center font-semibold text-body-md">\${item.quantity}</span>
                            <button aria-label="Increase quantity" class="w-8 h-8 flex items-center justify-center text-primary hover:bg-surface-container-high rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[18px]">add</span>
                            </button>
                        </div>
                    </div>\`;
                    container.insertAdjacentHTML('beforeend', itemHtml);
                });
                
                document.getElementById('cart-subtotal').innerText = '₹' + Number(cart.total).toFixed(2);
                document.getElementById('cart-total').innerText = '₹' + Number(cart.total).toFixed(2);
            })
            .catch(() => {
                const container = document.getElementById('cart-items-container');
                if (container) container.innerHTML = '<div class="p-md text-error-red text-center">Failed to load cart.</div>';
            });

        // Add visual feedback for checkout button
        const checkoutBtn = document.querySelector('button span:contains("Proceed to Checkout")')?.parentElement;
        if (checkoutBtn) {
            checkoutBtn.addEventListener('mousedown', () => {
                checkoutBtn.classList.add('brightness-90');
            });
            checkoutBtn.addEventListener('mouseup', () => {
                checkoutBtn.classList.remove('brightness-90');
            });
        }
    </script>
</body></html>` }} 
        style={{ flex: 1 }} 
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}
