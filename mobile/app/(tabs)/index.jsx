import React from 'react';
import { SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView 
        source={{ html: `<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Go2Pick - Home</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        body {
            font-family: 'Inter', sans-serif;
            -webkit-font-smoothing: antialiased;
        }
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
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "tertiary-fixed-dim": "#4edea3",
                      "warning-amber": "#F59E0B",
                      "marketplace-orange": "#F97316",
                      "surface-container-lowest": "#ffffff",
                      "on-secondary-fixed-variant": "#783200",
                      "on-surface": "#0b1c30",
                      "border-gray": "#E2E8F0",
                      "on-surface-variant": "#434655",
                      "surface-slate": "#F8FAFC",
                      "surface-container-highest": "#d3e4fe",
                      "secondary-container": "#fd761a",
                      "inverse-primary": "#b4c5ff",
                      "surface-container": "#e5eeff",
                      "secondary-fixed": "#ffdbca",
                      "surface-container-high": "#dce9ff",
                      "inverse-surface": "#213145",
                      "tertiary-container": "#007d55",
                      "trust-blue": "#2563EB",
                      "inverse-on-surface": "#eaf1ff",
                      "surface-dim": "#cbdbf5",
                      "on-primary": "#ffffff",
                      "primary-fixed": "#dbe1ff",
                      "on-primary-fixed": "#00174b",
                      "surface-container-low": "#eff4ff",
                      "on-error": "#ffffff",
                      "error-container": "#ffdad6",
                      "tertiary-fixed": "#6ffbbe",
                      "surface-variant": "#d3e4fe",
                      "outline-variant": "#c3c6d7",
                      "secondary": "#9d4300",
                      "on-error-container": "#93000a",
                      "on-tertiary-fixed-variant": "#005236",
                      "primary": "#004ac6",
                      "secondary-fixed-dim": "#ffb690",
                      "on-tertiary": "#ffffff",
                      "on-secondary-container": "#5c2400",
                      "surface": "#f8f9ff",
                      "on-primary-fixed-variant": "#003ea8",
                      "outline": "#737686",
                      "on-tertiary-fixed": "#002113",
                      "surface-tint": "#0053db",
                      "error-red": "#EF4444",
                      "on-secondary": "#ffffff",
                      "on-background": "#0b1c30",
                      "on-primary-container": "#eeefff",
                      "surface-bright": "#f8f9ff",
                      "tertiary": "#006242",
                      "primary-container": "#2563eb",
                      "on-tertiary-container": "#bdffdb",
                      "background": "#f8f9ff",
                      "primary-fixed-dim": "#b4c5ff",
                      "error": "#ba1a1a",
                      "on-secondary-fixed": "#341100",
                      "success-green": "#10B981"
              },
              "borderRadius": {
                      "DEFAULT": "0.25rem",
                      "lg": "0.5rem",
                      "xl": "0.75rem",
                      "full": "9999px"
              },
              "spacing": {
                      "xs": "8px",
                      "lg": "24px",
                      "base": "4px",
                      "md": "16px",
                      "2xl": "48px",
                      "container-max": "1280px",
                      "sm": "12px",
                      "xl": "32px",
                      "gutter": "16px"
              },
              "fontFamily": {
                      "headline-lg-mobile": ["Plus Jakarta Sans"],
                      "display-lg": ["Plus Jakarta Sans"],
                      "body-md": ["Inter"],
                      "body-lg": ["Inter"],
                      "label-sm": ["Inter"],
                      "title-md": ["Plus Jakarta Sans"],
                      "headline-lg": ["Plus Jakarta Sans"]
              },
              "fontSize": {
                      "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "700"}],
                      "display-lg": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                      "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                      "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                      "title-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                      "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}]
              }
            },
          },
        }
      </script>
</head>
<body class="bg-surface text-on-surface">
<!-- Top Navigation Bar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm">
<div class="flex items-center justify-between px-md h-16 w-full">
<div class="flex items-center gap-xs">
<img alt="Go2Pick Brand Logo" class="h-10 w-10 object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW8TssMjhMMMtqytgYLeGnQZF3hkA7ep4u2Fh0r89LNnVyZUftxu3EoaXuDIsB3owVwzSjrxtdKaU4VyUoER7MUOrIDei0okcpI4iyjt3DEQOREwYqKBwhN91-We4I7I_3czYXRDHmpC4t0fMyFsivK0YLVNkXGTt1p5kLz73lzoGHOZL_ONJYpU5FrZYJ6WT7LxwAFveXsN9_fLJVT3hs3LLx-9sI5GT7bVkzbG4ZLPrBpMpjSzaCTG_dVHhjxj-H2W5Y3-pkAVmO"/>
<span class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold text-trust-blue">Go2Pick</span>
</div>
<div class="flex items-center gap-md">
<div class="hidden md:flex items-center space-x-lg mr-lg">
<a class="text-trust-blue font-bold font-body-md text-body-md" href="#">Home</a>
<a class="text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md rounded-lg px-2 py-1" href="#">Explore</a>
<a class="text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md rounded-lg px-2 py-1" href="#">Cart</a>
<a class="text-on-surface-variant hover:bg-surface-container-high transition-colors font-body-md text-body-md rounded-lg px-2 py-1" href="#">Profile</a>
</div>
<div class="active:scale-95 transition-transform cursor-pointer relative">
<span class="material-symbols-outlined text-trust-blue">notifications</span>
<span class="absolute top-0 right-0 h-2 w-2 bg-marketplace-orange rounded-full"></span>
</div>
<div class="h-10 w-10 rounded-full bg-surface-container-highest overflow-hidden border border-border-gray">
<img class="w-full h-full object-cover" data-alt="A clean, professional headshot of a smiling man in a minimalist setting. The lighting is soft and high-key, creating a warm, approachable atmosphere suitable for a user profile avatar. The background is a soft, solid neutral grey to emphasize the subject's friendly expression." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0a2cxlAd3XgffYKhoD4B6BnLlbMGkRW71EqZAARhJAGaqadZ_Zs-JSxW_71_1DxL0eYYXySawpinxIb7Cz4Qn6IDq02YDlSD6PlUVfZhKnEjY8Xhp3vTjkn0tIrG7Zb8B_gmTvS3n6NjOiS7jJaSMjzveJrpuoG6DyMKHItpE53YW1KEm4L7rvk05Q8cpkCw5dxkqduJdE5DgVqFG9pepsN7GJsEzSOfvKnlj5PTi2H01RzPXKXeIXqO2KQAEfWMN_gQEQNCFT06-"/>
</div>
</div>
</div>
</header>
<main class="pt-24 pb-20 px-md max-w-screen-container-max mx-auto">
<!-- User Greeting & Search -->
<section class="mb-xl">
<h1 class="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface mb-xs">Hello, Alex!</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-lg">What are you looking for today?</p>
<div class="relative w-full max-w-2xl">
<div class="absolute inset-y-0 left-0 pl-md flex items-center pointer-events-none">
<span class="material-symbols-outlined text-outline">search</span>
</div>
<input class="block w-full pl-xl pr-md py-4 bg-surface-container-low border border-border-gray rounded-xl focus:outline-none focus:ring-2 focus:ring-trust-blue focus:border-transparent transition-all font-body-md text-body-md shadow-sm" placeholder="Search for products, shops, or categories..." type="text"/>
</div>
</section>
<!-- Categories Section -->
<section class="mb-xl">
<div class="flex items-center justify-between mb-md">
<h2 class="font-title-md text-title-md text-on-surface">Categories</h2>
<button class="text-trust-blue font-label-sm text-label-sm hover:underline">View All</button>
</div>
<div id="categories-container" class="flex gap-md overflow-x-auto hide-scrollbar pb-xs">
  <div class="p-md text-on-surface-variant">Loading categories...</div>
</div>
</section>
<!-- Featured Shops Carousel -->
<section class="mb-xl">
<div class="flex items-center justify-between mb-md">
<h2 class="font-title-md text-title-md text-on-surface">Featured Shops</h2>
<button class="text-trust-blue font-label-sm text-label-sm hover:underline">See Nearby</button>
</div>
<div id="featured-shops-container" class="flex gap-md overflow-x-auto hide-scrollbar pb-xs">
  <div class="p-md text-on-surface-variant">Loading shops...</div>
</div>
</section>
<!-- Popular Products Grid -->
<section class="mb-2xl">
<div class="flex items-center justify-between mb-md">
<h2 class="font-title-md text-title-md text-on-surface">Popular Products</h2>
<button class="text-trust-blue font-label-sm text-label-sm hover:underline">View All</button>
</div>
<div id="popular-products-container" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
  <div class="p-md text-on-surface-variant col-span-2">Loading products...</div>
</div>
</section>
</main>
<!-- Bottom Navigation Bar -->
<nav class="fixed bottom-0 w-full z-50 rounded-t-xl bg-surface dark:bg-surface-dim shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:hidden">
<div class="flex justify-around items-center h-14 w-full px-xs pb-safe">
<a class="flex flex-col items-center justify-center text-trust-blue bg-surface-container-highest rounded-xl px-4 py-1 active:scale-90 transition-all" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">home</span>
<span class="font-label-sm text-label-sm">Home</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-90" href="#">
<span class="material-symbols-outlined">search</span>
<span class="font-label-sm text-label-sm">Explore</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-90" href="#">
<span class="material-symbols-outlined">shopping_cart</span>
<span class="font-label-sm text-label-sm">Cart</span>
</a>
<a class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-90" href="#">
<span class="material-symbols-outlined">person</span>
<span class="font-label-sm text-label-sm">Profile</span>
</a>
</div>
</nav>
<script>
        // Micro-interactions for adding items
        document.querySelectorAll('button').forEach(btn => {
            if (btn.querySelector('.material-symbols-outlined')?.textContent === 'add') {
                btn.addEventListener('click', function() {
                    this.classList.add('bg-success-green');
                    this.innerHTML = '<span class="material-symbols-outlined">check</span>';
                    setTimeout(() => {
                        this.classList.remove('bg-success-green');
                        this.innerHTML = '<span class="material-symbols-outlined">add</span>';
                    }, 1500);
                });
            }
        });

        // Floating shadow effect for header on scroll
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 10) {
                header.classList.add('shadow-md');
            } else {
                header.classList.remove('shadow-md');
            }
        });

        // Fetch shops dynamically
        fetch('http://localhost:8000/api/shops')
            .then(res => res.json())
            .then(shops => {
                console.log('DEBUG [Frontend Home] shops API response:', shops);
                const container = document.getElementById('featured-shops-container');
                if (!container) return;
                
                container.innerHTML = '';
                
                if (shops.length === 0) {
                    container.innerHTML = '<div class="p-md text-on-surface-variant">No featured shops available.</div>';
                } else {
                    shops.forEach(shop => {
                        const fallbackImage = 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400';
                        const imageUrl = shop.image || shop.imageUrl || shop.shopImageUrl || fallbackImage;
                        const rating = (shop.rating || 0) === 0 ? 0 : Number(shop.rating).toFixed(1);
                        const shopName = shop.name || shop.shopName || 'Unnamed Shop';
                        const category = shop.category || 'Category';
                        
                        const shopHtml = \`
                        <div class="flex-shrink-0 w-72 bg-white rounded-xl overflow-hidden shadow-sm border border-border-gray hover:shadow-md transition-shadow cursor-pointer" onclick="window.location.href='/shops/${shop.id}'">
                            <div class="h-40 w-full overflow-hidden">
                                <img class="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src="\${imageUrl}" onerror="this.src='\${fallbackImage}'"/>
                            </div>
                            <div class="p-md">
                                <div class="flex justify-between items-start mb-xs">
                                    <h3 class="font-body-lg text-body-lg font-bold text-on-surface">\${shopName}</h3>
                                    <div class="flex items-center gap-1 bg-surface-container-high px-2 py-0.5 rounded-full">
                                        <span class="material-symbols-outlined text-warning-amber text-[14px]" style="font-variation-settings: 'FILL' 1;">star</span>
                                        <span class="font-label-sm text-label-sm text-on-surface">\${rating}</span>
                                    </div>
                                </div>
                                <p class="font-body-md text-body-md text-on-surface-variant mb-xs">\${category}</p>
                            </div>
                        </div>
                        \`;
                        container.insertAdjacentHTML('beforeend', shopHtml);
                    });
                }
                
        // Fetch categories dynamically
        fetch('http://localhost:8000/api/customer/categories')
            .then(res => res.json())
            .then(categories => {
                const container = document.getElementById('categories-container');
                if (!container) return;
                container.innerHTML = '';
                
                let categoriesList = categories;
                if (categories.categories) categoriesList = categories.categories;
                
                if (!Array.isArray(categoriesList) || categoriesList.length === 0) {
                    container.innerHTML = '<div class="p-md text-on-surface-variant">No categories available.</div>';
                    return;
                }
                
                const defaultCategoryImages = {
                    'Bakery': 'http://localhost:8000/static/bakery.jpg',
                    'Electronics': 'http://localhost:8000/static/electronics.jpg',
                    'Grocery': 'http://localhost:8000/static/grocery.jpg',
                    'Groceries': 'http://localhost:8000/static/grocery.jpg',
                    'Home': 'http://localhost:8000/static/home.jpg',
                    'Pharmacy': 'http://localhost:8000/static/pharmacy.jpg',
                    'Ready to Eat': 'http://localhost:8000/static/ready_to_eat.jpg'
                };
                
                categoriesList.forEach(category => {
                    const imageUrl = category.image || defaultCategoryImages[category.name] || defaultCategoryImages['Grocery'];
                    const catHtml = \`
                    <div class="flex-shrink-0 flex flex-col items-center gap-xs cursor-pointer" onclick="window.location.href='/categories?category=\${encodeURIComponent(category.name)}'">
                        <div class="h-16 w-16 md:h-20 md:w-20 rounded-full overflow-hidden bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors shadow-sm group">
                            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="\${imageUrl}" onerror="this.src='\${defaultCategoryImages[category.name] || defaultCategoryImages['Grocery']}'"/>
                        </div>
                        <span class="font-label-sm text-label-sm text-on-surface-variant font-semibold mt-1">\${category.name || 'Category'}</span>
                    </div>\`;
                    container.insertAdjacentHTML('beforeend', catHtml);
                });
            })
            .catch(() => {
                const container = document.getElementById('categories-container');
                if (container) container.innerHTML = '<div class="p-md text-error-red">Failed to load categories.</div>';
            });

        // Fetch products dynamically
        fetch('http://localhost:8000/api/customer/products?limit=4')
            .then(res => res.json())
            .then(products => {
                const container = document.getElementById('popular-products-container');
                if (!container) return;
                container.innerHTML = '';
                
                let productsList = products;
                if (products.products) productsList = products.products;
                
                if (!Array.isArray(productsList) || productsList.length === 0) {
                    container.innerHTML = '<div class="p-md text-on-surface-variant col-span-2">No products available.</div>';
                    return;
                }
                
                productsList.slice(0, 4).forEach(product => {
                    const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400';
                    const imageUrl = (product.images && product.images[0]) || fallbackImage;
                    const price = Number(product.price).toFixed(2);
                    
                    const prodHtml = \`
                    <div class="bg-white rounded-xl p-xs shadow-sm border border-border-gray flex flex-col hover:shadow-md transition-shadow group cursor-pointer" onclick="window.location.href='/products/\${product.id}'">
                        <div class="aspect-[4/3] rounded-lg overflow-hidden mb-xs relative">
                            <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" src="\${imageUrl}" onerror="this.src='\${fallbackImage}'"/>
                            <div class="absolute top-2 right-2 h-8 w-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-on-surface-variant hover:text-error-red cursor-pointer active:scale-90 transition-all">
                                <span class="material-symbols-outlined text-[20px]">favorite_border</span>
                            </div>
                        </div>
                        <div class="px-xs flex-grow">
                            <p class="font-label-sm text-label-sm text-on-surface-variant mb-1">\${product.category || 'Product'}</p>
                            <h4 class="font-body-md text-body-md font-bold text-on-surface line-clamp-1">\${product.name}</h4>
                            <div class="flex items-center justify-between mt-xs pb-xs">
                                <span class="font-body-lg text-body-lg font-bold text-trust-blue">₹\${price}</span>
                                <button class="h-10 w-10 rounded-xl bg-trust-blue text-white flex items-center justify-center active:scale-90 transition-all shadow-md">
                                    <span class="material-symbols-outlined">add</span>
                                </button>
                            </div>
                        </div>
                    </div>\`;
                    container.insertAdjacentHTML('beforeend', prodHtml);
                });
            })
            .catch(() => {
                const container = document.getElementById('popular-products-container');
                if (container) container.innerHTML = '<div class="p-md text-error-red col-span-2">Failed to load products.</div>';
            });
    </script>
</body></html>` }} 
        style={{ flex: 1 }} 
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}
