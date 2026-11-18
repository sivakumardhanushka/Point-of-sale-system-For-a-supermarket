import React, { useState, useRef, useEffect } from 'react';
import PhoneSmsModal from '../components/PhoneSmsModal';
import {
  Scan,
  Search,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  RotateCcw,
  CreditCard,
  Tag,
  ShoppingBag,
  AlertCircle,
  CheckCircle,
  Percent,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { playSound } from '../db/storage';
import Barcode from '../components/Barcode';


export default function POS({
  products,
  categories,
  customers,
  settings,
  onCompleteSale,
  onHoldBill,
  holdBills,
  onOpenHoldModal,
  onOpenRefundModal,
  onSaveProduct
}) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0] || null);
  const [showPhoneSms, setShowPhoneSms] = useState(false);

  const [billDiscountPercent, setBillDiscountPercent] = useState(0);
  const [bagChargeAmount, setBagChargeAmount] = useState(0); // Optional shopping bag charge
  const [scanNotice, setScanNotice] = useState(null);
  const [quickAddBarcode, setQuickAddBarcode] = useState(null);
  // Helper to generate SMS message body
  const generateSmsMessage = () => {
    const lines = cart.map(item => `${item.name} x${item.qty} = ${currency}${item.total.toFixed(2)}`);
    const totalLine = `Total: ${currency}${netPayable.toFixed(2)}`;
    return [...lines, totalLine].join('\n');
  };
  const [editingDiscountId, setEditingDiscountId] = useState(null);


  const barcodeInputRef = useRef(null);
  const currency = settings.currency || 'Rs.';

  // Quick Supermarket Staple Shortcuts
  const stapleShortcuts = [
    { label: 'Basmati Rice', icon: '🌾', query: 'Basmati' },
    { label: 'Samba Rice', icon: '🌾', query: 'Samba' },
    { label: 'White Sugar', icon: '🍬', query: 'White Crystal Sugar' },
    { label: 'Brown Sugar', icon: '🍬', query: 'Brown Cane Sugar' },
    { label: 'Anchor Milk', icon: '🥛', query: 'Anchor' },
    { label: 'Maliban Milk', icon: '🥛', query: 'Maliban Full Cream' },
    { label: 'Munchee Crackers', icon: '🍪', query: 'Cream Cracker' },
    { label: 'Chocolate Biscuits', icon: '🍪', query: 'Chocolate Cream' },
    { label: 'Carrots', icon: '🥕', query: 'Carrots' },
    { label: 'Potatoes', icon: '🥔', query: 'Potatoes' },
    { label: 'Onions', icon: '🧅', query: 'Onions' },
    { label: 'Tomatoes', icon: '🍅', query: 'Tomatoes' },
  ];

  // Keep barcode input focused for physical USB barcode scanner wedge
  useEffect(() => {
    const focusBarcode = () => {
      // only focus if not interacting with modal or another input
      const activeEl = document.activeElement;
      if (!activeEl || activeEl.tagName === 'BODY' || activeEl === barcodeInputRef.current) {
        barcodeInputRef.current?.focus();
      }
    };
    focusBarcode();
    const interval = setInterval(focusBarcode, 2000);

    const handleResume = (e) => {
      if (e.detail) {
        setCart(e.detail.cart || []);
        if (e.detail.customer) setSelectedCustomer(e.detail.customer);
      }
    };
    window.addEventListener('pos-resume-cart', handleResume);

    return () => {
      clearInterval(interval);
      window.removeEventListener('pos-resume-cart', handleResume);
    };
  }, []);

  // Handle barcode submission (from hardware scanner or manual typing)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    // 1. Check if scanned barcode is a Credit Buyer ID Card barcode
    const customerMatch = customers.find(c =>
      (c.creditBarcode && c.creditBarcode.toLowerCase() === code.toLowerCase()) ||
      (c.id && c.id.toLowerCase() === code.toLowerCase()) ||
      (code.startsWith('CR-') && (
        c.creditBarcode?.toLowerCase() === code.toLowerCase() ||
        c.id?.toLowerCase().includes(code.replace('CR-', '').toLowerCase())
      ))
    );

    if (customerMatch) {
      setSelectedCustomer(customerMatch);
      setBarcodeInput('');
      playSound('success');
      const bal = Number(customerMatch.creditBalance || 0);
      const limit = Number(customerMatch.creditLimit || 0);
      const avail = Math.max(0, limit - bal);
      showScanNotice(`✓ Credit Buyer Scanned: ${customerMatch.name} | Avail Credit: ${currency} ${avail.toLocaleString()}`, 'success');
      return;
    }

    // 2. Search for product by exact barcode or SKU or ID
    const found = products.find(p =>
      p.barcode === code ||
      p.sku.toLowerCase() === code.toLowerCase() ||
      p.id.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      addToCart(found);
      setBarcodeInput('');
      playSound('success');
      showScanNotice(`✓ Scanned: ${found.name}`, 'success');
    } else {
      playSound('error');
      showScanNotice(`⚠ Item not registered: ${code}`, 'error', code);
      setBarcodeInput('');
    }
  };

  const showScanNotice = (msg, type, unregisteredCode = null) => {
    setScanNotice({ msg, type, unregisteredCode });
    if (!unregisteredCode) {
      setTimeout(() => setScanNotice(null), 3000);
    }
  };

  const addToCart = (product, customQty = 1) => {
    if (product.currentStock <= 0) {
      playSound('error');
      showScanNotice(`Warning: ${product.name} is OUT OF STOCK!`, 'error');
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        const newQty = Math.round((existing.qty + customQty) * 100) / 100;
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, qty: newQty, total: Math.max(0, (newQty * item.price) - (item.discount || 0)) }
            : item
        );
      } else {
        const newQty = customQty;
        return [...prev, {
          productId: product.id,
          name: product.name,
          barcode: product.barcode,
          sku: product.sku,
          price: product.sellingPrice,
          costPrice: product.costPrice,
          qty: newQty,
          discount: 0,
          total: Math.max(0, newQty * product.sellingPrice),
          taxRate: product.taxRate || 0,
          unit: product.unit
        }];
      }
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0.01, Math.round((item.qty + delta) * 100) / 100);
        return { ...item, qty: newQty, total: Math.max(0, (newQty * item.price) - (item.discount || 0)) };
      }
      return item;
    }));
  };

  const setExactQty = (productId, val) => {
    const parsed = parseFloat(val);
    const newQty = isNaN(parsed) || parsed < 0.01 ? 0.01 : Math.round(parsed * 100) / 100;
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, qty: newQty, total: Math.max(0, (newQty * item.price) - (item.discount || 0)) };
      }
      return item;
    }));
  };

  const setItemDiscount = (productId, discAmount) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const disc = Math.max(0, Number(discAmount) || 0);
        return { ...item, discount: disc, total: Math.max(0, (item.qty * item.price) - disc) };
      }
      return item;
    }));
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm('Clear all items in current cart?')) {
      setCart([]);
      setBillDiscountPercent(0);
    }
  };

  const handleHoldCurrentBill = () => {
    if (cart.length === 0) {
      alert('Cart is empty. Add products before placing bill on hold.');
      return;
    }
    const billData = {
      id: `hold-${Date.now()}`,
      cart,
      customer: selectedCustomer,
      subtotal,
      total: netPayable,
      heldAt: new Date().toISOString()
    };
    onHoldBill(billData);
    setCart([]);
    playSound('checkout');
    showScanNotice('Customer cart placed on hold!', 'success');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const itemDiscountsTotal = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  const billDiscountAmount = (subtotal * (Number(billDiscountPercent) || 0)) / 100;
  const totalDiscount = itemDiscountsTotal + billDiscountAmount;

  // Tax calculation (tax charges removed)
  const taxAmount = 0;
  const netPayable = Math.max(0, subtotal - totalDiscount + (Number(bagChargeAmount) || 0));

  // Filter products for touch grid
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch && p.isActive !== false;
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-slate-950 text-slate-100">

      {/* LEFT & CENTER: Product Catalog & Fast Barcode Area */}
      <div className="flex-1 flex flex-col border-r border-slate-800/80 overflow-hidden">

        {/* Top Control Bar: Barcode Scanner Input & Quick Search */}
        <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center gap-3">

          {/* Barcode Scanner Box with Scan Animation */}
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
            <div className="absolute left-3 top-2.5 text-emerald-400">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Scan Barcode or Type SKU + Press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl pl-10 pr-24 py-2 text-sm text-emerald-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
            />
            <span className="absolute right-3 top-2.5 text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
              Scanner Ready
            </span>
          </form>

          {/* Product Name Search Box */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500"
            />
          </div>

          {/* Action buttons: Hold List & Return */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenHoldModal}
              className="relative flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
              title="View Parked / Held Carts (F11)"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              <span>Held</span>
              {holdBills.length > 0 && (
                <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {holdBills.length}
                </span>
              )}
            </button>

            <button
              onClick={onOpenRefundModal}
              className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-rose-300 transition"
              title="Process Return / Refund (F12)"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Refund</span>
            </button>
          </div>
        </div>

        {/* Scan Status Toast Banner */}
        {scanNotice && (
          <div className={`px-4 py-2 text-xs font-medium flex items-center justify-between transition-all animate-in slide-in-from-top-2 ${scanNotice.type === 'success'
            ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800/80'
            : 'bg-rose-950/80 text-rose-300 border-b border-rose-800/80'
            }`}>
            <div className="flex items-center space-x-2.5">
              <span>{scanNotice.msg}</span>
              {scanNotice.unregisteredCode && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickAddBarcode(scanNotice.unregisteredCode);
                    setScanNotice(null);
                  }}
                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Product & Ring Up</span>
                </button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] opacity-75 font-mono">Scanner Active</span>
              <button onClick={() => setScanNotice(null)} className="text-slate-400 hover:text-white font-bold text-xs ml-1">✕</button>
            </div>
          </div>
        )}

        {/* Category Filter Chips */}
        <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${selectedCategory === 'all'
              ? 'bg-slate-200 text-slate-900 shadow'
              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
          >
            All Items ({products.length})
          </button>
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${isSelected
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Supermarket Staples Bar (1-Click Fast Ring-Up) */}
        <div className="px-3 py-1.5 bg-slate-950/70 border-b border-slate-800/50 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 shrink-0 flex items-center gap-1 mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Fast Staples:</span>
          </span>
          {stapleShortcuts.map((staple, idx) => {
            const prd = products.find(p => p.name.toLowerCase().includes(staple.query.toLowerCase()));
            if (!prd) return null;
            return (
              <button
                key={idx}
                onClick={() => {
                  addToCart(prd);
                  playSound('success');
                  showScanNotice(`+ Added ${prd.name}`, 'success');
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/60 rounded-lg text-[11px] font-medium text-slate-300 hover:text-white transition shrink-0 flex items-center gap-1.5 cursor-pointer shadow-sm"
                title={`Click to add ${prd.name} (${currency} ${prd.sellingPrice.toFixed(2)})`}
              >
                <span>{staple.icon}</span>
                <span>{staple.label}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold ml-0.5">
                  {currency}{prd.sellingPrice.toFixed(0)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Touch Product Grid */}
        <div className="flex-1 p-3 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 auto-rows-max">
          {filteredProducts.map((p) => {
            const isLowStock = p.currentStock > 0 && p.currentStock <= p.minStock;
            const isOutOfStock = p.currentStock <= 0;
            return (
              <button
                key={p.id}
                onClick={() => {
                  addToCart(p);
                  playSound('success');
                }}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer group relative overflow-hidden ${isOutOfStock
                  ? 'bg-slate-900/50 border-rose-900/40 opacity-60 hover:opacity-100'
                  : isLowStock
                    ? 'bg-slate-900 border-amber-800/50 hover:border-amber-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/70 hover:shadow-lg hover:shadow-emerald-950/30'
                  }`}
              >
                {/* Header Tag */}
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                    {p.sku}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isOutOfStock
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : isLowStock
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-400'
                    }`}>
                    {isOutOfStock ? 'OUT' : `${p.currentStock} left`}
                  </span>
                </div>

                {/* Product Name */}
                <h4 className="font-semibold text-xs text-slate-100 line-clamp-2 leading-snug group-hover:text-emerald-300 transition mb-2">
                  {p.name}
                </h4>

                {/* Footer Price & Barcode */}
                <div className="mt-auto pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">
                    {currency} {p.sellingPrice.toFixed(2)}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono truncate max-w-[65px]">
                    {p.barcode.slice(-5)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* RIGHT: High-Speed Checkout Cart Terminal */}
      <div className="w-96 md:w-[420px] bg-slate-900/95 flex flex-col border-l border-slate-800 select-none shadow-2xl">

        {/* Cart Header & Customer Selector */}
        <div className="p-3 bg-slate-800/70 border-b border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm text-white">Current Ticket</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">
                {cart.reduce((a, b) => a + b.qty, 0)} items
              </span>
            </div>

            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="text-xs text-slate-400 hover:text-rose-400 disabled:opacity-40 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>

          {/* Customer Selector Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <select
                value={selectedCustomer?.id || 'cust-walkin'}
                onChange={(e) => {
                  const cust = customers.find(c => c.id === e.target.value);
                  setSelectedCustomer(cust || customers[0]);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.mobile !== '0000000000' ? `(${c.mobile})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer?.points > 0 && (
              <div className="px-2 py-1 bg-amber-950/60 border border-amber-800/60 rounded-lg text-amber-300 text-[11px] font-bold shrink-0">
                ★ {selectedCustomer.points} pts
              </div>
            )}
          </div>

          {/* Credit status banner for selected registered customer */}
          {selectedCustomer && selectedCustomer.id !== 'cust-walkin' && selectedCustomer.creditAllowed && (
            <div className="flex items-center justify-between px-2.5 py-1 bg-amber-950/40 border border-amber-800/40 rounded-lg text-[11px]">
              <span className="text-amber-300 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Khata / Credit:</span>
              </span>
              <span className="font-mono text-slate-200">
                Bal: <strong className="text-amber-400">{currency}{Number(selectedCustomer.creditBalance || 0).toFixed(0)}</strong> / Limit: {currency}{Number(selectedCustomer.creditLimit || 0).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 space-y-2 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-600">
                <Scan className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Cart is currently empty</p>
              <p className="text-xs text-slate-600 max-w-[200px]">
                Scan barcode with USB scanner or click products on the left to add.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl p-2.5 space-y-1.5 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate flex-1">
                    <h5 className="font-semibold text-xs text-slate-100 truncate">{item.name}</h5>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span>{item.qty} {item.unit || 'unit'} × {currency} {item.price.toFixed(2)}</span>
                      <span>=</span>
                      <span className="text-slate-300 font-semibold">{currency} {(item.qty * item.price).toFixed(2)}</span>
                      {item.discount > 0 && (
                        <span className="text-amber-400 font-bold bg-amber-950/60 px-1 rounded">
                          -{currency} {item.discount.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingDiscountId(editingDiscountId === item.productId ? null : item.productId)}
                      className={`p-1 rounded transition text-xs flex items-center gap-0.5 ${item.discount > 0 ? 'text-amber-400 bg-amber-950/50' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'}`}
                      title="Apply Line Discount"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Line Discount Editor if open */}
                {editingDiscountId === item.productId && (
                  <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-amber-800/60 rounded-lg text-xs animate-in fade-in">
                    <span className="text-[10px] text-amber-300 font-medium">Line Discount ({currency}):</span>
                    <input
                      type="number"
                      min="0"
                      max={item.qty * item.price}
                      value={item.discount || ''}
                      placeholder="0"
                      onChange={(e) => setItemDiscount(item.productId, e.target.value)}
                      className="w-20 bg-slate-950 border border-amber-600/50 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => setEditingDiscountId(null)}
                      className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-medium ml-auto"
                    >
                      Done
                    </button>
                  </div>
                )}

                {/* Qty Stepper, Direct Number Input & Item Total */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1">
                    <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQty(item.productId, -1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                        title="Decrease Qty (-1)"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        value={item.qty}
                        onChange={(e) => setExactQty(item.productId, e.target.value)}
                        className="w-14 text-center text-xs font-mono font-bold text-white bg-slate-950 border border-slate-700 rounded py-0.5 focus:outline-none focus:border-emerald-500"
                        title="Type exact quantity or weight (e.g. 1.5)"
                      />
                      <button
                        onClick={() => updateQty(item.productId, 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
                        title="Increase Qty (+1)"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Quick fractional weight chips for produce / bulk items */}
                    {(item.unit?.toLowerCase().includes('kg') || item.unit?.toLowerCase().includes('pack')) && (
                      <div className="flex items-center space-x-1 ml-1">
                        <button
                          onClick={() => updateQty(item.productId, 0.5)}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-400 rounded transition"
                          title="Add 0.5 kg"
                        >
                          +0.5
                        </button>
                        <button
                          onClick={() => updateQty(item.productId, 1)}
                          className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-emerald-400 rounded transition"
                          title="Add 1.0 kg"
                        >
                          +1
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      {currency} {item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculations & Checkout Tray */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">

          {/* Subtotal, Discount & Tax Rows */}
          <div className="space-y-1 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">{currency} {subtotal.toFixed(2)}</span>
            </div>

            {/* Bill Discount Input */}
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center space-x-1">
                <span>Discount (%)</span>
              </span>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={billDiscountPercent}
                  onChange={(e) => setBillDiscountPercent(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-right font-mono text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="font-mono text-slate-300">-{currency} {totalDiscount.toFixed(2)}</span>
              </div>
            </div>

            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Tax ({settings.taxRate}%)</span>
                <span className="font-mono text-slate-200">+{currency} {taxAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Shopping Bag Charge — optional, cashier-editable */}
            <div className="flex justify-between items-center py-0.5">
              <span className="flex items-center space-x-1">
                <span>Bag Charge</span>
              </span>
11              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={bagChargeAmount || ''}
                  placeholder="0"
                  onChange={(e) => setBagChargeAmount(Math.max(0, Number(e.target.value) || 0))}
                  className="w-14 bg-slate-900 border border-teal-700/60 rounded px-1.5 py-0.5 text-xs text-right font-mono text-white focus:outline-none focus:border-teal-400"
                  title="Optional shopping bag charge added by cashier"
                />
                {Number(bagChargeAmount) > 0 && (
                  <span className="font-mono text-teal-300">+{currency} {Number(bagChargeAmount).toFixed(2)}</span>
                )}
                {Number(bagChargeAmount) > 0 && (
                  <button
                    type="button"
                    onClick={() => setBagChargeAmount(0)}
                    className="text-slate-500 hover:text-rose-400 transition text-xs ml-0.5"
                    title="Remove bag charge"
                  >✕</button>
                )}
              </div>
            </div>
          </div>

          {/* Net Payable Big Banner */}
          <div className="p-3 bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-500/40 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Net Payable</span>
              <span className="text-2xl font-black font-mono text-white">
                {currency} {netPayable.toFixed(2)}
              </span>
            </div>
            {settings.smsEnabled && selectedCustomer?.mobile && (
              <button onClick={() => setShowPhoneSms(true)} className="ml-2 px-3 py-1 bg-teal-600 hover:bg-teal-500 text-xs text-white rounded">Send SMS via Phone</button>
            )}
            <span className="text-xs text-slate-400 font-mono">
              {cart.reduce((a, b) => a + b.qty, 0)} Items
            </span>
          </div>

          {/* Bottom Action Grid: Hold & Pay */}
          <div className="flex gap-2">
            <button
              onClick={handleHoldCurrentBill}
              disabled={cart.length === 0}
              className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-bold transition border border-slate-700"
              title="Park / Hold Current Customer Bill (F10)"
            >
              <PauseCircle className="w-4 h-4 text-amber-400" />
              <span>Hold (F10)</span>
            </button>

            <button
              onClick={() => {
                if (cart.length === 0) {
                  alert('Please add at least 1 item to cart before checkout.');
                  return;
                }
                onCompleteSale({
                  cart,
                  subtotal,
                  discount: totalDiscount,
                  tax: taxAmount,
                  bagCharge: Number(bagChargeAmount) || 0,
                  total: netPayable,
                  customer: selectedCustomer
                });
              }}
              disabled={cart.length === 0}
              className="flex-2 flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 text-white text-sm font-bold shadow-lg shadow-emerald-900/50 transition cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>PAY NOW (F9 / Space)</span>
            </button>
          </div>

        </div>

      </div>

      {/* Quick Add Product Modal when an unknown barcode is scanned */}
      {quickAddBarcode && (
        <QuickAddProductModal
          barcode={quickAddBarcode}
          categories={categories}
          currency={currency}
          onClose={() => setQuickAddBarcode(null)}
          onSave={(newProduct) => {
            onSaveProduct?.(newProduct);
            addToCart(newProduct);
            playSound('success');
            showScanNotice(`✓ Registered & added to cart: ${newProduct.name}`, 'success');
            setQuickAddBarcode(null);
          }}
        />
      )}

    </div>
  );
}

// Sub-component: Fast Ring-Up Modal for Barcodes Not Yet in Catalog
function QuickAddProductModal({ barcode, categories, currency, onClose, onSave }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'cat-grains');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [unit, setUnit] = useState('pack');
  const [stock, setStock] = useState(25);
  const nameInputRef = useRef(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !sellingPrice) {
      alert('Product name and selling price are required.');
      return;
    }
    const sell = Number(sellingPrice) || 0;
    const cost = Number(costPrice) || Math.round(sell * 0.8);
    const newProduct = {
      id: `prd-${Date.now()}`,
      barcode: barcode.trim(),
      sku: `SKU-${barcode.slice(-4) || Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      category,
      unit,
      costPrice: cost,
      sellingPrice: sell,
      currentStock: Number(stock) || 25,
      minStock: 10,
      batchNo: `B-${new Date().toISOString().slice(0, 7)}`,
      expiryDate: '',
      taxRate: 0,
      isActive: true,
      imageColor: 'from-emerald-700 to-teal-800'
    };
    onSave(newProduct);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/80 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <Scan className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Quick Register Scanned Barcode</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {/* Scanned Barcode Box */}
          <div className="p-3 bg-slate-950 border border-emerald-500/40 rounded-xl flex items-center justify-between shadow-inner">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase tracking-wider block">Scanned Item Barcode</span>
              <span className="text-sm font-mono font-black text-white">{barcode}</span>
            </div>
            <div className="bg-white px-2 py-1 rounded border border-slate-300">
              <Barcode value={barcode} height={24} scale={1.2} showText={false} />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Product Name *</label>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="e.g. Marie Biscuits 200g, Anchor Butter..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
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
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pack, 1kg, bottle"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Selling Price ({currency}) *</label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 180"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Cost Price ({currency})</label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 140"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Opening Stock Quantity</label>
            <input
              type="number"
              min="1"
              value={stock}
              onChange={(e) => setStock(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-950 flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save & Ring Up to Cart</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

