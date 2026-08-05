import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api';

export default function AddEditProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product || {};

  const [name, setName] = useState(product.name || '');
  const [category, setCategory] = useState(product.category || '');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState(product.description || '');
  const [price, setPrice] = useState(product.price ? product.price.toString().replace('₹', '') : '');
  const [stock, setStock] = useState(product.stock !== undefined ? parseInt(product.stock) : 0);
  const [threshold, setThreshold] = useState(product.threshold || 5);

  const predefinedUnits = ['pc', 'kg', 'g', 'L', 'ml', 'pack', 'box', 'bottle', 'dozen', 'pair', 'meter', 'feet', 'bag', 'sack', 'bundle', 'sheet', 'roll', 'set', 'carton', 'tray'];
  const initialUnit = product.unit ? (predefinedUnits.includes(product.unit.toLowerCase()) ? product.unit.toLowerCase() : 'custom') : 'pc';
  const [unit, setUnit] = useState(initialUnit);
  const [customUnit, setCustomUnit] = useState(initialUnit === 'custom' ? product.unit : '');

  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  useEffect(() => {
    let stream;
    if (showCamera) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.error("Camera access denied", err);
          alert("Camera access denied. Please check permissions.");
          setShowCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [showCamera]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setShowCamera(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategory = category === 'other' ? customCategory : category;
    const finalPrice = parseFloat(price) || 0;
    const finalStock = parseInt(stock) || 0;
    const finalUnit = (unit === 'custom' ? customUnit : unit)?.trim() || 'pc';

    if (!name || !finalCategory || finalPrice <= 0) {
      alert("Please enter a valid name, category, and price (greater than 0).");
      return;
    }

    try {
      const payload = {
        name,
        category: finalCategory,
        description: description || "",
        price: finalPrice,
        stock: finalStock,
        unit: finalUnit,
        images: capturedImage ? [capturedImage] : (product.images || []),
        isAvailable: true
      };

      if (product.id) {
        await api.put(`/api/shopkeeper/products/${product.id}`, payload);
      } else {
        await api.post('/api/shopkeeper/products', payload);
      }
      alert('Product saved successfully!');
      navigate('/shopkeeper/products');
    } catch (err) {
      console.error("Failed to save product:", err);
      alert(err.response?.data?.detail || "Failed to save product");
    }
  };

  return (
    <>
      

{/* TopAppBar */}
<header className="bg-surface/80 backdrop-blur-md shadow-sm fixed top-0 w-full z-50 flex justify-between items-center px-lg h-14">
<div className="flex items-center gap-4">
<button aria-label="Go back" onClick={() => navigate('/shopkeeper/products')} className="text-on-surface hover:bg-surface-container-low transition-colors p-2 rounded-full active:scale-95 duration-150">
<span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
</button>
<h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{product.name ? 'Edit Product' : 'Add New Product'}</h1>
</div>
<div className="flex items-center gap-2">
<div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant">
<img alt="Shopkeeper Profile" className="w-full h-full object-cover" data-alt="A professional close-up portrait of a shop owner in a clean, modern workspace. The lighting is bright and natural, reflecting a high-trust, professional environment. The aesthetic is clean and corporate with a soft-focus background of a well-organized retail store. Deep blues and whites dominate the color palette to ensure a modern, trustworthy business atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzH2GMCSHLKbGiWOHBus4YvpnRbJejzpDGr_raH2VAAb4lrGzqqn2qCnZFdlMDXSXZQwON4OCAXbfq_7IgrasZWZmifBfESPxDhynLL1krvxiYvPIrawsh_oxNFDjn1pXaCEKhyb-FIaMncnsYnqohA51lcpnL6AHR5PaSxnMgKpWzzWRCgNQnhYxgc2CCnAvGv5oOAygW2aZXAY7EvXdToSkWeAQ64NhwYViep-ObErgOTu6TvXU3cqOn4kuY8Ojhr5UQk3u_Ljv-"/>
</div>
</div>
</header>
<main className="max-w-2xl mx-auto px-md pt-20">
{/* Image Upload Widget */}
<section className="mb-lg">
<div className="flex gap-4">
  <div onClick={() => setShowCamera(true)} className="relative flex-1 group cursor-pointer bg-surface-container rounded-xl border-2 border-dashed border-outline-variant hover:border-marketplace-orange transition-all duration-300 flex flex-col items-center justify-center py-8 overflow-hidden">
    {capturedImage ? (
      <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <div className="flex flex-col items-center text-on-surface-variant group-hover:text-marketplace-orange transition-colors">
        <span className="material-symbols-outlined text-[32px] mb-2" data-icon="camera_alt">camera_alt</span>
        <span className="font-title-md text-sm font-bold">Take Photo</span>
        <p className="font-label-sm text-[10px] opacity-60 mt-1">Use Camera</p>
      </div>
    )}
  </div>
  
  <div className="relative flex-1 group cursor-pointer bg-surface-container rounded-xl border-2 border-dashed border-outline-variant hover:border-trust-blue transition-all duration-300 flex flex-col items-center justify-center py-8 overflow-hidden">
    <div className="flex flex-col items-center text-on-surface-variant group-hover:text-trust-blue transition-colors">
      <span className="material-symbols-outlined text-[32px] mb-2" data-icon="upload_file">upload_file</span>
      <span className="font-title-md text-sm font-bold">Upload File</span>
      <p className="font-label-sm text-[10px] opacity-60 mt-1">PNG, JPG</p>
    </div>
    <input accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" type="file"/>
  </div>
</div>
</section>
{/* Product Form */}
<form className="space-y-lg" onSubmit={handleSubmit}>
{/* Basic Information Card */}
<div className="bg-surface rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] p-md space-y-md">
<div className="space-y-base">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Product Name</label>
<input className="w-full h-12 px-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg" placeholder="e.g. Organic Arabica Coffee" type="text" value={name} onChange={(e) => setName(e.target.value)} />
</div>
<div className="space-y-base">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Category</label>
<div className="relative">
<select className="w-full h-12 px-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg cursor-pointer" value={category} onChange={(e) => setCategory(e.target.value)}>
<option value="">Select a category</option>
<option value="beverages">Beverages</option>
<option value="snacks">Snacks</option>
<option value="fresh">Fresh Produce</option>
<option value="bakery">Bakery</option>
<option value="pantry">Pantry Staples</option>
<option value="other">Other (Specify)</option>
</select>
</div>
{category === 'other' && (
  <div className="mt-xs">
    <input className="w-full h-12 px-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg" placeholder="Type your custom category..." type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} />
  </div>
)}
</div>

<div className="space-y-base">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Product Unit</label>
<div className="relative">
<select className="w-full h-12 px-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg cursor-pointer" value={unit} onChange={(e) => setUnit(e.target.value)}>
<option value="pc">Piece (pc)</option>
<option value="kg">Kg</option>
<option value="g">Gram (g)</option>
<option value="L">Litre (L)</option>
<option value="ml">Millilitre (ml)</option>
<option value="pack">Pack</option>
<option value="box">Box</option>
<option value="bottle">Bottle</option>
<option value="dozen">Dozen</option>
<option value="pair">Pair</option>
<option value="meter">Meter</option>
<option value="feet">Feet</option>
<option value="bag">Bag</option>
<option value="sack">Sack</option>
<option value="bundle">Bundle</option>
<option value="sheet">Sheet</option>
<option value="roll">Roll</option>
<option value="set">Set</option>
<option value="carton">Carton</option>
<option value="tray">Tray</option>
<option value="custom">Custom Unit (Specify)</option>
</select>
</div>
{unit === 'custom' && (
  <div className="mt-xs">
    <input className="w-full h-12 px-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg" placeholder="Type custom unit (e.g. glass, basket)..." type="text" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} />
  </div>
)}
</div>

<div className="space-y-base">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Description</label>
<textarea className="w-full p-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg resize-none" placeholder="Describe the product features, origin, and quality..." rows="4" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
</div>
</div>
{/* Inventory & Pricing Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-md">
<div className="bg-surface rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] p-md space-y-base">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Price (₹)</label>
<div className="relative">
<span className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant font-title-md">₹</span>
<input className="w-full h-12 pl-10 pr-md bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-body-lg text-body-lg" placeholder="0.00" step="0.01" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
</div>
</div>
<div className="bg-surface rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] p-md space-y-base">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Stock Quantity</label>
<div className="flex items-center bg-surface-container-lowest border border-border-gray rounded-lg h-12 overflow-hidden">
<button className="w-12 h-full flex items-center justify-center hover:bg-surface-container-low active:scale-90 transition-all text-on-surface-variant" onClick={() => setStock(s => Math.max(0, s - 1))} type="button">
<span className="material-symbols-outlined" data-icon="remove">remove</span>
</button>
<input className="flex-1 h-full text-center border-none bg-transparent focus:ring-0 font-title-md text-title-md" min="0" type="number" value={stock} onChange={(e) => setStock(parseInt(e.target.value) || 0)} />
<button className="w-12 h-full flex items-center justify-center hover:bg-surface-container-low active:scale-90 transition-all text-on-surface-variant" onClick={() => setStock(s => s + 1)} type="button">
<span className="material-symbols-outlined" data-icon="add">add</span>
</button>
</div>
</div>
</div>
{/* Alerts Card */}
<div className="bg-surface rounded-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] p-md flex items-center justify-between gap-md">
<div className="space-y-1">
<label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Low Stock Threshold</label>
<p className="font-body-md text-body-md text-on-surface-variant opacity-70">Notify me when stock falls below:</p>
</div>
<input className="w-20 h-12 text-center bg-surface-container-lowest border border-border-gray rounded-lg focus:ring-2 focus:ring-marketplace-orange/20 focus:border-marketplace-orange outline-none transition-all font-title-md text-title-md" type="number" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value) || 0)} />
</div>
{/* Action Buttons */}
<div className="flex flex-col-reverse md:flex-row gap-md pt-lg">
<button onClick={() => navigate('/shopkeeper/products')} className="flex-1 h-14 font-title-md text-title-md text-marketplace-orange bg-transparent border-2 border-marketplace-orange rounded-xl hover:bg-marketplace-orange/5 transition-colors active:scale-95 duration-150" type="button">
                    Cancel
                </button>
<button className="flex-[2] h-14 font-title-md text-title-md text-white bg-marketplace-orange shadow-lg shadow-marketplace-orange/20 rounded-xl hover:brightness-110 transition-all active:scale-95 duration-150 flex items-center justify-center gap-2" type="submit">
<span className="material-symbols-outlined" data-icon="save">save</span>
                    Save Product
                </button>
</div>
</form>
</main>
    {showCamera && (
      <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col items-center justify-center px-4 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-2xl bg-surface rounded-2xl overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-border-gray">
            <h3 className="font-title-lg font-bold">Take Photo</h3>
            <button onClick={() => setShowCamera(false)} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">close</button>
          </div>
          <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
            <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
            
            {/* Camera Overlay Guides */}
            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/30">
               <div className="absolute inset-0 border-2 border-white/50 border-dashed m-4 rounded-lg"></div>
            </div>
          </div>
          <div className="p-6 flex justify-center bg-surface-container-lowest">
            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-surface-slate flex items-center justify-center shadow-lg active:scale-90 transition-transform group">
               <div className="w-12 h-12 rounded-full bg-trust-blue group-hover:bg-primary transition-colors"></div>
            </button>
          </div>
        </div>
      </div>
    )}

    </>
  );
}
