import React from 'react';
import { SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Screen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView 
        source={{ html: `<!DOCTYPE html><html class="light" lang="en"><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>Go2Pick - Marcus Holloway Profile</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "on-primary-container": "#eeefff",
                    "on-background": "#0b1c30",
                    "inverse-primary": "#b4c5ff",
                    "primary-container": "#2563eb",
                    "on-tertiary": "#ffffff",
                    "error": "#ba1a1a",
                    "tertiary-fixed-dim": "#4edea3",
                    "outline": "#737686",
                    "error-container": "#ffdad6",
                    "on-secondary-fixed": "#341100",
                    "primary": "#004ac6",
                    "primary-fixed-dim": "#b4c5ff",
                    "surface-variant": "#d3e4fe",
                    "on-tertiary-fixed": "#002113",
                    "trust-blue": "#2563EB",
                    "surface-container-high": "#dce9ff",
                    "outline-variant": "#c3c6d7",
                    "on-secondary-fixed-variant": "#783200",
                    "error-red": "#EF4444",
                    "inverse-surface": "#213145",
                    "on-error-container": "#93000a",
                    "marketplace-orange": "#F97316",
                    "surface-container-low": "#eff4ff",
                    "on-surface": "#0b1c30",
                    "tertiary": "#006242",
                    "secondary": "#9d4300",
                    "on-secondary-container": "#5c2400",
                    "on-error": "#ffffff",
                    "success-green": "#10B981",
                    "on-secondary": "#ffffff",
                    "primary-fixed": "#dbe1ff",
                    "on-tertiary-fixed-variant": "#005236",
                    "background": "#f8f9ff",
                    "on-primary-fixed": "#00174b",
                    "on-surface-variant": "#434655",
                    "surface-container-highest": "#d3e4fe",
                    "secondary-fixed-dim": "#ffb690",
                    "surface-container": "#e5eeff",
                    "secondary-fixed": "#ffdbca",
                    "on-primary-fixed-variant": "#003ea8",
                    "tertiary-container": "#007d55",
                    "on-tertiary-container": "#bdffdb",
                    "secondary-container": "#fd761a",
                    "surface-tint": "#0053db",
                    "surface-container-lowest": "#ffffff",
                    "on-primary": "#ffffff",
                    "surface-dim": "#cbdbf5",
                    "surface-slate": "#F8FAFC",
                    "surface": "#f8f9ff",
                    "border-gray": "#E2E8F0",
                    "tertiary-fixed": "#6ffbbe",
                    "inverse-on-surface": "#eaf1ff",
                    "warning-amber": "#F59E0B",
                    "surface-bright": "#f8f9ff"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "xl": "32px",
                    "xs": "8px",
                    "md": "16px",
                    "gutter": "16px",
                    "base": "4px",
                    "2xl": "48px",
                    "sm": "12px",
                    "lg": "24px",
                    "container-max": "1280px"
            },
            "fontFamily": {
                    "title-md": ["Plus Jakarta Sans"],
                    "headline-lg": ["Plus Jakarta Sans"],
                    "body-md": ["Inter"],
                    "label-sm": ["Inter"],
                    "body-lg": ["Inter"],
                    "display-lg": ["Plus Jakarta Sans"],
                    "headline-lg-mobile": ["Plus Jakarta Sans"]
            },
            "fontSize": {
                    "title-md": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "700"}],
                    "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "body-lg": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "display-lg": ["40px", {"lineHeight": "48px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-lg-mobile": ["24px", {"lineHeight": "32px", "fontWeight": "700"}]
            }
          },
        },
      }
    </script>
<style>
        body { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-background text-on-background min-h-screen pb-24">
<!-- TopAppBar -->
<header class="fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface/80 backdrop-blur-md shadow-sm">
<div class="flex items-center justify-between px-md h-14 w-full">
<button class="text-primary dark:text-inverse-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform">
<span class="material-symbols-outlined">menu</span>
</button>
<h1 class="font-headline-lg-mobile text-headline-lg-mobile text-primary dark:text-inverse-primary font-bold">Go2Pick</h1>
<a href="/settings" class="text-primary dark:text-inverse-primary hover:opacity-80 transition-opacity active:scale-95 transition-transform flex items-center justify-center">
<span class="material-symbols-outlined">settings</span>
</a>
</div>
</header>
<main class="pt-20 px-gutter max-w-container-max mx-auto space-y-lg">
<!-- Profile Header Section -->
<section class="relative">
<div class="bg-primary rounded-xl overflow-hidden h-32 md:h-48 mb-16 shadow-lg">
<div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 24px 24px;"></div>
</div>
<div class="absolute bottom-0 left-gutter flex flex-col md:flex-row items-end md:items-center gap-md">
<div class="relative">
<img alt="Marcus Holloway" class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-surface shadow-xl object-cover" data-alt="A professional portrait of Marcus Holloway, a stylish man in his late 20s with a confident expression. The lighting is soft and cinematic, utilizing a bright, airy aesthetic typical of a modern digital profile. The background is a clean, blurred urban setting with subtle blue and white tones that match the trust-blue brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqaKhpkooD-GGOSou9UxsVlzCVUMrg0eHvq6KI2s93EYjZ_2TaUBy_5yqbENieIx1CEk4Dehv845KEFutVKzxYT31DBtFHufbDAL05lJ9zhtr-s1kF8wXtgoLrM1ToskwCH4RDWOgDTuyDtCR0rsDpMXZFOmiiQys7hBuljFX9mFncVlo48c6-MLsSpkXpiLBn-Yy6n-rF8IHvZU3BIuH0c6GbPL80fL4xPlak3uxA6l-C-_B_zIt9gypIDLvFwGGmHdFOB8Iaprl7">
<div class="absolute bottom-1 right-1 bg-success-green w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-surface"></div>
</div>
<div class="mb-2 md:mb-4">
<h2 class="font-title-md text-title-md text-on-background">Marcus Holloway</h2>
<p class="font-body-md text-body-md text-on-surface-variant">marcus.holloway@example.com</p>
</div>
</div>
</section>
<!-- Become a Shopkeeper Promo (Bento Style) -->
<section class="bg-secondary-container rounded-xl p-lg flex flex-col md:flex-row items-center justify-between gap-md shadow-md text-on-secondary-container">
<div class="flex-1 space-y-xs text-center md:text-left">
<h3 class="font-title-md text-title-md font-bold">Turn your passion into profit</h3>
<p class="font-body-md text-body-md opacity-90">Join thousands of sellers on Go2Pick. Start managing your own shop today with our precise shopkeeper tools.</p>
</div>
<button class="bg-on-secondary-container text-on-secondary px-lg py-sm rounded-full font-label-sm text-label-sm hover:opacity-90 transition-all active:scale-95 flex items-center gap-xs">
                Become a Shopkeeper
                <span class="material-symbols-outlined">arrow_forward</span>
</button>
</section>
<!-- Menu Sections Grid -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
<!-- My Account -->
<section class="space-y-md">
<div class="flex items-center gap-xs px-base">
<span class="material-symbols-outlined text-trust-blue" style="font-variation-settings: 'FILL' 1;">person_filled</span>
<h4 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">My Account</h4>
</div>
<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-border-gray border border-border-gray">
<button class="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-on-surface-variant">edit_square</span>
<span class="font-body-md text-body-md">Edit Profile</span>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
<button class="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-on-surface-variant">location_on</span>
<span class="font-body-md text-body-md">Shipping Address</span>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
</div>
</section>
<!-- Activity -->
<section class="space-y-md">
<div class="flex items-center gap-xs px-base">
<span class="material-symbols-outlined text-trust-blue" style="font-variation-settings: 'FILL' 1;">activity_zone</span>
<h4 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Activity</h4>
</div>
<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-border-gray border border-border-gray">
<button class="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-on-surface-variant">history</span>
<span class="font-body-md text-body-md">Order History</span>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
<button class="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-on-surface-variant">reviews</span>
<span class="font-body-md text-body-md">My Reviews</span>
</div>
<span class="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</button>
</div>
</section>
<!-- Preferences -->
<section class="space-y-md">
<div class="flex items-center gap-xs px-base">
<span class="material-symbols-outlined text-trust-blue" style="font-variation-settings: 'FILL' 1;">tune</span>
<h4 class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Preferences</h4>
</div>
<div class="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden divide-y divide-border-gray border border-border-gray">
<button class="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-on-surface-variant">notifications</span>
<span class="font-body-md text-body-md">Notifications</span>
</div>
<div class="flex items-center gap-xs">
<span class="bg-error-container text-on-error-container px-2 py-0.5 rounded-full text-[10px] font-bold">2</span>
<span class="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</div>
</button>
<button class="w-full px-md py-lg flex items-center justify-between hover:bg-surface-container-low transition-colors group">
<div class="flex items-center gap-md">
<span class="material-symbols-outlined text-on-surface-variant">language</span>
<span class="font-body-md text-body-md">Language</span>
</div>
<div class="flex items-center gap-xs">
<span class="text-label-sm text-outline">EN</span>
<span class="material-symbols-outlined text-outline-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
</div>
</button>
</div>
</section>
</div>
<!-- Recent Activity Mini-Feed -->
<section class="space-y-md pb-lg">
<h4 class="font-title-md text-title-md px-base">Recent Order</h4>
<div class="glass-card rounded-xl p-md flex items-center gap-md shadow-sm">
<img alt="Product" class="w-16 h-16 rounded-lg object-cover bg-surface-container" data-alt="A pair of vibrant red athletic sneakers presented in a professional product photography style. The image has a clean, high-key white background and sharp focus, conveying quality and trustworthiness. The soft shadows and clear textures of the shoe fabric highlight the attention to detail essential for the Go2Pick marketplace." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCL4QiW3idyA8iGaLZczO3yN6-PXZysmBmPlkGUnlyUbAb74k1-KVwMu--u4U5uJKYX7yPVYKjKvopdmnYlyvGVjvNPQKedMZWYKAbRlLpah31Ezr3F6v6RwL4MnvSheqiVO7yKgfGn-941xxfF1zx6ZhyQ7ffvWKU2-jrka77w7lBGOv1auTy0P7RyUJ1rrCKAZtSi1DwuFfgy16_3OuWrCMHRH6yjq66t4IsSXi5-UocfahRjkf1XpF5yUDFCJErjXlnB7-bQhBnI">
<div class="flex-grow">
<div class="flex justify-between items-start">
<div>
<p class="font-label-sm text-label-sm text-success-green">Picked up • Today</p>
<p class="font-body-md text-body-md font-bold">SpeedMax Pro Runners</p>
</div>
<p class="font-body-md text-body-md font-bold text-trust-blue">\$129.00</p>
</div>
</div>
</div>
</section>
<!-- Logout Section -->
<div class="flex justify-center pt-md pb-2xl">
<button class="flex items-center gap-xs text-error font-label-sm text-label-sm hover:opacity-80 transition-opacity px-lg py-sm">
<span class="material-symbols-outlined">logout</span>
                Sign Out
            </button>
</div>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-gutter pb-safe bg-surface dark:bg-surface-container-highest shadow-lg rounded-t-xl">
<button class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-90 transition-transform">
<span class="material-symbols-outlined">home</span>
<span class="font-label-sm text-label-sm">Home</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-90 transition-transform">
<span class="material-symbols-outlined">shopping_bag</span>
<span class="font-label-sm text-label-sm">Orders</span>
</button>
<button class="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 active:scale-90 transition-transform">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">person</span>
<span class="font-label-sm text-label-sm">Profile</span>
</button>
<button class="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active:scale-90 transition-transform">
<span class="material-symbols-outlined">swap_horiz</span>
<span class="font-label-sm text-label-sm">Switch</span>
</button>
</nav>
<script>
        // Micro-interactions for buttons
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if(!this.classList.contains('active:scale-95') && !this.classList.contains('active:scale-90')) {
                    this.classList.add('active:scale-95');
                    setTimeout(() => this.classList.remove('active:scale-95'), 150);
                }
            });
        });

        // Simple scroll listener to add extra elevation to header
        window.addEventListener('scroll', () => {
            const header = document.querySelector('header');
            if (window.scrollY > 20) {
                header.classList.add('shadow-md');
            } else {
                header.classList.remove('shadow-md');
            }
        });
    </script>


</body></html>` }} 
        style={{ flex: 1 }} 
        originWhitelist={['*']}
      />
    </SafeAreaView>
  );
}
