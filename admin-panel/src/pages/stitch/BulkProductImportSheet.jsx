import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const DEFAULT_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=200";

export default function BulkProductImportSheet() {
  const navigate = useNavigate();
  
  const [rows, setRows] = useState([
    { id: 1, name: '', description: '', price: '', stock: '', threshold: '', category: '', imageUrl: '', uploadedUrl: '', unit: 'pc' },
    { id: 2, name: '', description: '', price: '', stock: '', threshold: '', category: '', imageUrl: '', uploadedUrl: '', unit: 'pc' },
    { id: 3, name: '', description: '', price: '', stock: '', threshold: '', category: '', imageUrl: '', uploadedUrl: '', unit: 'pc' },
    { id: 4, name: '', description: '', price: '', stock: '', threshold: '', category: '', imageUrl: '', uploadedUrl: '', unit: 'pc' },
    { id: 5, name: '', description: '', price: '', stock: '', threshold: '', category: '', imageUrl: '', uploadedUrl: '', unit: 'pc' },
  ]);
  const [showProgress, setShowProgress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      alert(`File "${file.name}" ready for processing! (Simulated)`);
      e.target.value = null;
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRowImageUpload = async (id, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { default: api } = await import('../../services/api');
      const res = await api.post('/api/uploads/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        updateRow(id, 'uploadedUrl', res.data.url);
      }
    } catch (err) {
      console.error("Failed to upload product image:", err);
      alert("Failed to upload product image");
    }
  };

  const addRow = () => {
    setRows([...rows, { id: Date.now(), name: '', description: '', price: '', stock: '', threshold: '', category: '', imageUrl: '', uploadedUrl: '', unit: 'pc' }]);
  };

  const deleteRow = (id) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const clearAll = () => setRows([]);
  
  const saveAll = () => {
    // Filter out rows that are completely empty
    const validRows = rows.filter(r => 
      r.name?.trim() || 
      r.description?.trim() || 
      r.price?.toString().trim() || 
      r.stock?.toString().trim() || 
      r.threshold?.toString().trim() || 
      r.category?.trim() || 
      r.imageUrl?.trim() || 
      r.uploadedUrl?.trim()
    );

    if (validRows.length === 0) {
      alert("Please enter at least one product.");
      return;
    }

    // Validate required fields
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      const rowNum = rows.indexOf(r) + 1;
      if (!r.name?.trim()) {
        alert(`Validation Error (Row ${rowNum}): Product Name is required.`);
        return;
      }
      
      const priceVal = parseFloat(r.price);
      if (isNaN(priceVal) || priceVal <= 0) {
        alert(`Validation Error (Row ${rowNum}): Price is required and must be greater than 0.`);
        return;
      }
      
      if (!r.category?.trim()) {
        alert(`Validation Error (Row ${rowNum}): Category is required.`);
        return;
      }
      
      if (r.stock !== undefined && r.stock !== '' && isNaN(parseInt(r.stock))) {
        alert(`Validation Error (Row ${rowNum}): Stock must be a valid number.`);
        return;
      }
    }

    // Validation passed, open confirmation modal
    setShowProgress(true);
    setIsSaving(false);
  };

  const triggerSave = async () => {
    const validRows = rows.filter(r => 
      r.name?.trim() || 
      r.description?.trim() || 
      r.price?.toString().trim() || 
      r.stock?.toString().trim() || 
      r.threshold?.toString().trim() || 
      r.category?.trim() || 
      r.imageUrl?.trim() || 
      r.uploadedUrl?.trim()
    );

    const payload = {
      products: validRows.map(r => ({
        name: r.name.trim(),
        description: r.description?.trim() || '',
        price: parseFloat(r.price) || 0.0,
        stock: parseInt(r.stock) || 0,
        threshold: parseInt(r.threshold) || 5,
        category: r.category.trim(),
        imageUrl: r.uploadedUrl || r.imageUrl?.trim() || DEFAULT_PRODUCT_IMAGE,
        unit: r.unit || 'pc'
      }))
    };

    setIsSaving(true);
    const apiUrl = '/api/shopkeeper/products/bulk';
    console.log("Bulk Import - API URL:", apiUrl);
    console.log("Bulk Import - Products Payload:", payload);

    try {
      const { default: api } = await import('../../services/api');
      const res = await api.post(apiUrl, payload);
      console.log("Bulk Import - API Response:", res.data);

      setIsSaving(false);
      setShowProgress(false);
      alert("Products imported successfully");
      navigate('/shopkeeper/products');
    } catch (err) {
      console.error("Bulk Import - API Error:", err);
      let errorMsg = "Failed to bulk save products";
      if (err.response) {
        console.error("Bulk Import - API Error Response Data:", err.response.data);
        console.error("Bulk Import - API Error Response Status:", err.response.status);
        errorMsg = err.response.data?.detail || err.response.data?.message || errorMsg;
      }
      setIsSaving(false);
      setShowProgress(false);
      alert(errorMsg);
    }
  };

  return (
    <div className="font-body-md text-body-md bg-surface min-h-screen">
      {/*  Top App Bar  */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-border-gray shadow-sm">
      <div className="flex items-center px-4 h-14 w-full max-w-container-max mx-auto">
      <button onClick={() => navigate('/shopkeeper/products')} aria-label="Go back" className="p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95">
      <span className="material-symbols-outlined text-primary">arrow_back</span>
      </button>
      <h1 className="ml-2 font-title-md text-title-md text-primary">Bulk Import</h1>
      <div className="flex-grow"></div>
      <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant" onClick={() => setShowHelp(true)}>
      <span className="material-symbols-outlined">help_outline</span>
      </button>
      </div>
      </header>
      <main className="pt-14 pb-48">
      {/*  Dashboard Header Context  */}
      <div className="px-4 py-6 max-w-container-max mx-auto">
      <div className="flex flex-col gap-2">
      <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Inventory Accelerator</h2>
      <p className="font-body-md text-on-surface-variant">Add multiple products to your shop in seconds. Tip: Use <span className="font-semibold">Tab</span> to move quickly between fields.</p>
      </div>
      </div>
      {/*  Spreadsheet Grid Container  */}
      <div className="px-4 max-w-container-max mx-auto">
      <div className="bg-surface-container-lowest border border-border-gray rounded-xl shadow-sm overflow-hidden">
      {/*  Header Row  */}
      <div className="overflow-x-auto custom-scrollbar" id="grid-container">
      <table className="w-full text-left border-collapse min-w-[1000px]">
      <thead>
      <tr className="bg-surface-container-low border-b border-border-gray">
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-16 sticky-col bg-surface-container-low">#</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant min-w-[280px]">Product Image</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant min-w-[200px]">Product Name *</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant min-w-[300px]">Description</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-32">Price *</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-32">Stock</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-32">Threshold</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-32">Unit</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-48">Category *</th>
      <th className="py-3 px-4 font-label-sm text-label-sm text-on-surface-variant w-12 text-center"></th>
      </tr>
      </thead>
      <tbody id="product-rows">
        {rows.map((row, index) => {
          const displayImage = row.uploadedUrl || row.imageUrl;
          return (
            <tr key={row.id} className="border-b border-border-gray hover:bg-surface-slate transition-colors group">
              <td className="py-2 px-4 font-label-sm text-on-surface-variant w-16 sticky-col">{index + 1}</td>
              <td className="py-2 px-4">
                <div className="flex items-center gap-2 min-w-[280px]">
                  <div className="w-9 h-9 border border-border-gray rounded-md overflow-hidden bg-surface-container flex items-center justify-center flex-shrink-0">
                    {displayImage ? (
                      <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-outline text-[18px]">image</span>
                    )}
                  </div>
                  <input 
                    type="text" 
                    placeholder="Paste URL..." 
                    className="flex-grow bg-transparent border-b border-border-gray focus:border-marketplace-orange focus:ring-0 focus:outline-none placeholder:text-outline/40 text-xs py-1 min-w-[120px]"
                    value={row.imageUrl || ''}
                    onChange={(e) => updateRow(row.id, 'imageUrl', e.target.value)}
                  />
                  <label className="p-1 rounded-full hover:bg-surface-container-low transition-colors cursor-pointer text-primary active:scale-95 flex-shrink-0" title="Upload image">
                    <span className="material-symbols-outlined text-[18px]">upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRowImageUpload(row.id, file);
                      }}
                    />
                  </label>
                </div>
              </td>
              <td className="py-2 px-4"><input className="w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-outline/50 min-w-[200px]" placeholder="e.g. Wireless Mouse" type="text" value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} /></td>
              <td className="py-2 px-4"><input className="w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-outline/50 min-w-[300px]" placeholder="Brief description..." type="text" value={row.description} onChange={(e) => updateRow(row.id, 'description', e.target.value)} /></td>
              <td className="py-2 px-4">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-outline/50 min-w-[100px]" 
                  placeholder="0.00" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={row.price ?? ''} 
                  onChange={(e) => updateRow(row.id, 'price', e.target.value)} 
                  onKeyDown={(e) => { if (['e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                />
              </td>
              <td className="py-2 px-4">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-outline/50 min-w-[100px]" 
                  placeholder="0" 
                  type="number" 
                  step="1"
                  min="0"
                  value={row.stock ?? ''} 
                  onChange={(e) => updateRow(row.id, 'stock', e.target.value)} 
                  onKeyDown={(e) => { if (['.', 'e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                />
              </td>
              <td className="py-2 px-4">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-outline/50 min-w-[100px]" 
                  placeholder="5" 
                  type="number" 
                  step="1"
                  min="0"
                  value={row.threshold ?? ''} 
                  onChange={(e) => updateRow(row.id, 'threshold', e.target.value)} 
                  onKeyDown={(e) => { if (['.', 'e', 'E', '-', '+'].includes(e.key)) e.preventDefault(); }}
                />
              </td>
              <td className="py-2 px-4">
                <select 
                  className="bg-transparent border-none focus:ring-0 focus:outline-none min-w-[100px] text-xs py-1"
                  value={row.unit || 'pc'} 
                  onChange={(e) => updateRow(row.id, 'unit', e.target.value)}
                >
                  <option value="pc">pc</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                  <option value="pack">pack</option>
                  <option value="box">box</option>
                  <option value="bottle">bottle</option>
                  <option value="dozen">dozen</option>
                  <option value="pair">pair</option>
                  <option value="meter">meter</option>
                  <option value="feet">feet</option>
                  <option value="bag">bag</option>
                  <option value="sack">sack</option>
                  <option value="bundle">bundle</option>
                  <option value="sheet">sheet</option>
                  <option value="roll">roll</option>
                  <option value="set">set</option>
                  <option value="carton">carton</option>
                  <option value="tray">tray</option>
                </select>
              </td>
              <td className="py-2 px-4">
                <input 
                  className="w-full bg-transparent border-none focus:ring-0 focus:outline-none placeholder:text-outline/50 min-w-[120px]" 
                  placeholder="e.g. grocery" 
                  type="text" 
                  value={row.category} 
                  onChange={(e) => updateRow(row.id, 'category', e.target.value)} 
                />
              </td>
            <td className="py-2 px-4 text-center">
              <button className="text-outline hover:text-error-red transition-colors opacity-0 group-hover:opacity-100" onClick={() => deleteRow(row.id)}>
                <span className="material-symbols-outlined text-[20px]">delete</span>
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
      </table>
      </div>
      {/*  Add Row Button  */}
      <div className="p-4 border-t border-border-gray bg-surface-container-lowest">
      <button className="flex items-center gap-2 text-marketplace-orange font-label-sm text-label-sm hover:underline active:scale-95 transition-transform" onClick={addRow}>
      <span className="material-symbols-outlined">add_circle</span>
                              ADD NEW ROW
                          </button>
      </div>
      </div>
      {/*  Bulk Actions Cards  */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="p-4 bg-surface-container rounded-xl border-l-4 border-marketplace-orange flex items-center gap-4">
      <div className="bg-secondary-fixed p-3 rounded-full text-marketplace-orange">
      <span className="material-symbols-outlined">info</span>
      </div>
      <div>
      <p className="font-label-sm text-label-sm text-on-secondary-container">Importing Advice</p>
      <p className="font-body-md text-on-surface-variant">Low stock thresholds trigger push notifications to your device.</p>
      </div>
      </div>
      <div className="p-4 bg-surface-container-high rounded-xl flex items-center gap-4">
      <div className="bg-primary-container p-3 rounded-full text-white">
      <span className="material-symbols-outlined">upload_file</span>
      </div>
      <div>
      <p className="font-label-sm text-label-sm text-on-primary-fixed">External Upload</p>
      <p className="font-body-md text-on-surface-variant">Already have a CSV or Excel file? <button className="text-primary font-semibold hover:underline" onClick={() => fileInputRef.current?.click()}>Upload Here</button></p>
      <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
      </div>
      </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-surface rounded-2xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 text-marketplace-orange">
                <span className="material-symbols-outlined text-[28px]">help</span>
                <h3 className="font-title-lg text-title-lg text-on-surface">How to Bulk Import</h3>
              </div>
              <button className="text-on-surface-variant hover:bg-surface-container rounded-full p-1 transition-colors" onClick={() => setShowHelp(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4 font-body-md text-on-surface-variant">
              <p>Adding multiple products is simple and fast. Follow these steps:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Manual Entry:</strong> Type your product details directly into the grid. Use the <kbd className="px-2 py-1 bg-surface-container border border-border-gray rounded-md font-mono text-sm">Tab</kbd> key to instantly jump to the next field.</li>
                <li><strong>Add Rows:</strong> Need more space? Click the <span className="text-marketplace-orange font-semibold">ADD NEW ROW</span> button at the bottom of the grid.</li>
                <li><strong>External Files:</strong> If you already have your inventory in a spreadsheet, skip the grid and use the <strong>External Upload</strong> button at the bottom of the page to import a CSV or Excel file.</li>
                <li><strong>Finalize:</strong> Once everything looks good, click <strong>Save All Products</strong> to instantly add them to your store!</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="bg-marketplace-orange text-white px-6 py-2 rounded-xl font-label-md text-label-md shadow-md hover:brightness-110 active:scale-95 transition-all" onClick={() => setShowHelp(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      </main>
      {/*  Sticky Bottom Action Bar  */}
      <div className="fixed bottom-[72px] w-full bg-surface border-t border-border-gray p-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="max-w-container-max mx-auto flex items-center justify-between gap-4">
      <div className="hidden sm:block">
      <p className="font-body-md text-on-surface-variant" id="row-count">Ready to import {rows.length} products</p>
      </div>
      <div className="flex flex-1 sm:flex-none gap-3">
      <button className="flex-1 sm:w-32 py-3 px-4 border border-border-gray text-on-surface font-label-sm text-label-sm rounded-lg hover:bg-surface-container-low transition-colors active:scale-95" onClick={clearAll}>
                          Clear All
                      </button>
      <button className="flex-1 sm:w-48 py-3 px-4 bg-marketplace-orange text-white font-label-sm text-label-sm rounded-lg shadow-md hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2" onClick={saveAll}>
      <span className="material-symbols-outlined" style={{'fontSize': '20px'}}>save</span>
                          Save All Products
                      </button>
      </div>
      </div>
      </div>

      {showProgress && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-gutter">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
          <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl p-xl shadow-2xl text-center space-y-lg animate-[modalIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div className="w-20 h-20 bg-marketplace-orange/10 rounded-full flex items-center justify-center mx-auto text-marketplace-orange">
              {isSaving ? (
                <svg className="animate-spin h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span className="material-symbols-outlined text-[40px]">publish</span>
              )}
            </div>
            <div className="space-y-sm">
              <h3 className="font-headline-lg-mobile text-on-surface">
                {isSaving ? "Importing Products..." : "Publish Products"}
              </h3>
              <p className="text-body-md text-on-surface-variant">
                {isSaving 
                  ? "Please wait while we process your inventory sheet. This might take a moment."
                  : `Ready to publish ${rows.filter(r => r.name?.trim()).length} products to your catalog. Click Approve & Publish to continue.`}
              </p>
            </div>
            {isSaving && (
              <div className="w-full bg-surface-container rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-marketplace-orange h-full rounded-full animate-[progress_2s_ease-in-out_forwards]" style={{width: '0%'}}></div>
              </div>
            )}
            <div className="flex gap-sm pt-md">
              <button 
                className="flex-1 py-2 bg-marketplace-orange text-white rounded-lg font-label-sm active:scale-95 disabled:opacity-50"
                onClick={triggerSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Approve & Publish"}
              </button>
              <button 
                className="flex-1 py-2 border border-border-gray text-on-surface rounded-lg font-label-sm active:scale-95 disabled:opacity-50"
                onClick={() => setShowProgress(false)}
                disabled={isSaving}
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
