import React, { useState, useRef, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Calendar, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  SlidersHorizontal,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle2,
  X,
  Scan,
  Wand2,
  Sparkles,
  Tag,
  Printer
} from 'lucide-react';
import { playSound } from '../db/storage';
import Barcode from '../components/Barcode';
import { printProductLabel } from '../utils/labelPrinter';

export default function Inventory({ products, categories, onSaveProduct, onDeleteProduct, onAdjustStock, settings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, low, expired, out
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustType, setAdjustType] = useState('add'); // add or remove
  const [adjustReason, setAdjustReason] = useState('Stock Count Correction');
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [scannedBarcodeForNew, setScannedBarcodeForNew] = useState('');
  const [scanNotice, setScanNotice] = useState(null);
  const scanInputRef = useRef(null);

  const currency = settings.currency || 'Rs.';

  const handlePrintLabel = async (product) => {
    try {
      await printProductLabel(product, settings);
    } catch (err) {
      console.warn('Failed to print label:', err);
    }
  };

  const handleInventoryBarcodeScan = (e) => {
    e.preventDefault();
    const code = barcodeScanInput.trim();
    if (!code) return;

    // Check if product already exists
    const existing = products.find(p => 
      p.barcode === code || 
      p.sku.toLowerCase() === code.toLowerCase()
    );

    if (existing) {
      playSound('success');
      setSearchQuery(existing.name);
      setScanNotice({ msg: `✓ Found existing item: ${existing.name} (Stock: ${existing.currentStock})`, type: 'success' });
      setEditingProduct(existing);
    } else {
      playSound('checkout');
      setScannedBarcodeForNew(code);
      setEditingProduct(null);
      setIsAddModalOpen(true);
      setScanNotice({ msg: `✓ Scanned Barcode [${code}] - Fill details to save new item!`, type: 'info' });
    }
    setBarcodeScanInput('');
  };

  // Check if date is within next 14 days
  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 14;
  };

  const isExpired = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.barcode.includes(searchQuery) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.currentStock > 0 && p.currentStock <= p.minStock;
    } else if (stockFilter === 'out') {
      matchesStock = p.currentStock <= 0;
    } else if (stockFilter === 'expired') {
      matchesStock = isExpired(p.expiryDate) || isExpiringSoon(p.expiryDate);
    }

    return matchesCat && matchesSearch && matchesStock;
  });

  // Inventory stats
  const totalStockValue = products.reduce((sum, p) => sum + ((p.currentStock || 0) * (p.costPrice || 0)), 0);
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;
  const expiringCount = products.filter(p => isExpiringSoon(p.expiryDate)).length;

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    const delta = adjustType === 'add' ? Math.abs(Number(adjustQty)) : -Math.abs(Number(adjustQty));
    onAdjustStock(adjustModalProduct.id, delta, adjustReason);
    setAdjustModalProduct(null);
  };

  const handleExportCSV = () => {
    const headers = 'ID,Barcode,SKU,Name,Category,Unit,CostPrice,SellingPrice,CurrentStock,MinStock,ExpiryDate,BatchNo\n';
    const rows = products.map(p => 
      `"${p.id}","${p.barcode}","${p.sku}","${p.name.replace(/"/g, '""')}","${p.category}","${p.unit}","${p.costPrice}","${p.sellingPrice}","${p.currentStock}","${p.minStock}","${p.expiryDate || ''}","${p.batchNo || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `supermarket_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 space-y-4">
      
      {/* Top Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Catalog Items</span>
            <div className="text-xl font-bold text-white font-mono mt-0.5">{products.length} SKUs</div>
          </div>
          <div className="p-2.5 bg-slate-800 rounded-lg text-slate-300">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Inventory Value</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{currency} {totalStockValue.toLocaleString()}</div>
          </div>
          <div className="p-2.5 bg-emerald-950/60 rounded-lg text-emerald-400 border border-emerald-800/40">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Low Stock Alerts</span>
            <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">{lowStockCount} Products</div>
          </div>
          <div className="p-2.5 bg-amber-950/60 rounded-lg text-amber-400 border border-amber-800/40">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Near Expiry Alert</span>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">{expiringCount} Batches</div>
          </div>
          <div className="p-2.5 bg-rose-950/60 rounded-lg text-rose-400 border border-rose-800/40">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barcode Quick Scanner Bar (Scan to Add New Item or Lookup) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Scan className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Scan Barcode (Add or Edit Product)</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-semibold">
                USB Scanner Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Scan any product barcode with your barcode gun to register new stock or view details</p>
          </div>
        </div>

        <form onSubmit={handleInventoryBarcodeScan} className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
          <div className="relative flex-1">
            <input
              ref={scanInputRef}
              type="text"
              placeholder="Scan barcode or type & press Enter..."
              value={barcodeScanInput}
              onChange={(e) => setBarcodeScanInput(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-500/60 rounded-xl pl-3 pr-8 py-2 text-xs font-mono text-emerald-300 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 shrink-0 shadow cursor-pointer"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Scan</span>
          </button>
        </form>
      </div>

      {/* Scan Feedback Banner */}
      {scanNotice && (
        <div className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
          scanNotice.type === 'success' 
            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80' 
            : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
        }`}>
          <span>{scanNotice.msg}</span>
          <button onClick={() => setScanNotice(null)} className="text-slate-400 hover:text-white text-xs font-bold ml-2">✕</button>
        </div>
      )}

      {/* Main Filter & Action Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, barcode, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Stock status filter chips */}
        <div className="flex items-center space-x-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'low', label: 'Low Stock', count: lowStockCount },
            { id: 'out', label: 'Out of Stock', count: outOfStockCount },
            { id: 'expired', label: 'Near Expiry', count: expiringCount }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStockFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                stockFilter === f.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>{f.label}</span>
              {f.count !== undefined && f.count > 0 && (
                <span className="ml-1 text-[10px] bg-black/30 px-1 py-0.2 rounded-full">
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Action Buttons: Export & Add */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            title="Export full catalog to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-950 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

      </div>

      {/* Products Table */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-700">
              <tr>
                <th className="p-3">Product Name & SKU</th>
                <th className="p-3">Barcode</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling Price</th>
                <th className="p-3 text-center">Current Stock</th>
                <th className="p-3">Batch & Expiry</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map((p) => {
                const categoryObj = categories.find(c => c.id === p.category);
                const isLow = p.currentStock > 0 && p.currentStock <= p.minStock;
                const isOut = p.currentStock <= 0;
                const expiring = isExpiringSoon(p.expiryDate);
                const expired = isExpired(p.expiryDate);

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-semibold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.sku} • {p.unit || 'unit'}</div>
                    </td>

                    <td className="p-3 font-mono text-slate-300">
                      {p.barcode}
                    </td>

                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {categoryObj?.name || p.category}
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono text-slate-400">
                      {currency} {Number(p.costPrice).toFixed(2)}
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-white">
                      {currency} {Number(p.sellingPrice).toFixed(2)}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        isOut ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        isLow ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-200'
                      }`}>
                        {p.currentStock}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="text-[11px] font-mono text-slate-300">{p.batchNo || 'N/A'}</div>
                      {p.expiryDate && (
                        <div className={`text-[10px] flex items-center gap-1 ${
                          expired ? 'text-rose-400 font-bold' :
                          expiring ? 'text-amber-400 font-semibold' :
                          'text-slate-400'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          <span>{p.expiryDate} {expired ? '(EXPIRED)' : expiring ? '(SOON)' : ''}</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {isOut ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800/80">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                          Low Stock ({p.minStock} min)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                          In Stock
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handlePrintLabel(p)}
                          className="p-1.5 text-slate-400 hover:text-violet-400 hover:bg-slate-800 rounded transition"
                          title="Print Barcode Shelf Label"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setAdjustModalProduct(p)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition"
                          title="Adjust Stock Count"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <ProductFormModal
          product={editingProduct}
          initialBarcode={scannedBarcodeForNew}
          categories={categories}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
            setScannedBarcodeForNew('');
          }}
          onSave={(data) => {
            onSaveProduct(data);
            if (!editingProduct && settings?.labelAutoPrintOnNewProduct) {
              printProductLabel(data, settings);
            }
            setIsAddModalOpen(false);
            setEditingProduct(null);
            setScannedBarcodeForNew('');
            playSound('success');
          }}
          settings={settings}
          currency={currency}
        />
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Adjust Stock Count</h3>
              <button onClick={() => setAdjustModalProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700 text-xs">
              <p className="font-bold text-slate-200">{adjustModalProduct.name}</p>
              <p className="text-slate-400">Current Stock: <span className="font-mono font-bold text-emerald-400">{adjustModalProduct.currentStock}</span></p>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-lg font-bold transition ${
                    adjustType === 'add' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-2 rounded-lg font-bold transition ${
                    adjustType === 'remove' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  - Deduct Stock
                </button>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Adjustment Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Stock Count Correction">Stock Count Correction</option>
                  <option value="Damaged / Broken goods">Damaged / Broken goods</option>
                  <option value="Expired write-off">Expired write-off</option>
                  <option value="Internal supermarket use">Internal supermarket use</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub-component: Product Form Modal
function ProductFormModal({ product, categories, onClose, onSave, currency, initialBarcode = '', settings }) {
  const [formData, setFormData] = useState({
    id: product?.id || '',
    name: product?.name || '',
    barcode: product?.barcode || initialBarcode || '',
    sku: product?.sku || (initialBarcode ? `SKU-${initialBarcode.slice(-4)}` : `SKU-${Math.floor(100 + Math.random() * 900)}`),
    category: product?.category || categories[0]?.id || '',
    unit: product?.unit || 'pack',
    costPrice: product?.costPrice ?? 100,
    sellingPrice: product?.sellingPrice ?? 150,
    currentStock: product?.currentStock ?? 20,
    minStock: product?.minStock ?? 10,
    batchNo: product?.batchNo || `B-${new Date().toISOString().slice(0, 7)}`,
    expiryDate: product?.expiryDate || '',
    taxRate: product?.taxRate ?? 0,
    isActive: product?.isActive !== false
  });

  const barcodeInputRef = useRef(null);
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (initialBarcode) {
      nameInputRef.current?.focus();
    } else if (!product) {
      barcodeInputRef.current?.focus();
    }
  }, [initialBarcode, product]);

  const handleGenerateBarcode = () => {
    const generated = '200' + String(Math.floor(1000000000 + Math.random() * 9000000000));
    setFormData(prev => ({
      ...prev,
      barcode: generated,
      sku: prev.sku || `SKU-${generated.slice(-4)}`
    }));
    playSound('success');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode) {
      alert('Product name and barcode are required.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700 text-white">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Scan className="w-4 h-4 text-emerald-400" />
            <span>{product ? 'Edit Product' : 'Add New Supermarket Item'}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          {/* Barcode Scanner Box with Live Scan & Barcode Preview */}
          <div className="bg-slate-950/70 border border-emerald-500/40 p-3 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-200 font-bold flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-emerald-400" />
                <span>Barcode (Scan with Barcode Gun or Type) *</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateBarcode}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                title="Auto-generate a barcode for loose/unbranded items"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                required
                placeholder="Scan product barcode now..."
                value={formData.barcode}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  barcode: e.target.value.trim(),
                  sku: formData.sku || (e.target.value.trim() ? `SKU-${e.target.value.trim().slice(-4)}` : '')
                })}
                className="flex-1 bg-slate-950 border border-emerald-500/60 rounded-lg px-3 py-2 text-emerald-300 font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => {
                  barcodeInputRef.current?.focus();
                  barcodeInputRef.current?.select();
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <Scan className="w-3.5 h-3.5 text-emerald-400" />
                <span>Focus Scan</span>
              </button>
            </div>

            {/* Live Scannable Barcode Visual Preview */}
            {formData.barcode && (
              <div className="pt-1 flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-300 shadow-sm">
                <Barcode value={formData.barcode} height={30} scale={1.4} showText={true} />
              </div>
            )}
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Product Name *</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Basmati Rice 5kg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">SKU Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Unit Type</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                placeholder="e.g. 1kg, bottle, pack"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Cost Price ({currency})</label>
              <input
                type="number"
                step="any"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Selling Price ({currency}) *</label>
              <input
                type="number"
                step="any"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Current Stock Qty</label>
              <input
                type="number"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Min Stock (Alert threshold)</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Batch Number</label>
              <input
                type="text"
                value={formData.batchNo}
                onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => printProductLabel(formData, settings)}
              className="px-3.5 py-2 bg-violet-950/70 hover:bg-violet-900 border border-violet-700/60 text-violet-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Print Barcode Shelf Label on configured label printer driver"
            >
              <Tag className="w-3.5 h-3.5 text-violet-400" />
              <span>Print Label</span>
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-950 text-xs cursor-pointer"
              >
                Save Product
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
