import React, { useState } from 'react';
import { RotateCcw, Search, AlertCircle, CheckCircle, X, ShieldAlert } from 'lucide-react';

export default function RefundModal({ sales, onProcessRefund, onClose, currency = 'Rs.' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState('Customer returned goods');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const found = sales.find(s => 
      s.invoiceNo.toLowerCase().includes(query) || 
      (s.customerMobile && s.customerMobile.includes(query))
    );

    if (found) {
      if (found.status === 'Refunded') {
        setErrorMsg('This invoice has already been fully refunded.');
        setSelectedSale(null);
      } else {
        setSelectedSale(found);
        // Initialize return quantities to 0
        const qtys = {};
        found.items?.forEach(item => {
          qtys[item.productId] = 0;
        });
        setReturnQtys(qtys);
      }
    } else {
      setErrorMsg('No matching invoice found. Check invoice number.');
      setSelectedSale(null);
    }
  };

  const handleQtyChange = (productId, maxQty, val) => {
    const num = Math.min(maxQty, Math.max(0, parseInt(val, 10) || 0));
    setReturnQtys(prev => ({ ...prev, [productId]: num }));
  };

  // Calculate refund sum
  const totalRefundAmount = selectedSale ? (
    selectedSale.items?.reduce((sum, item) => {
      const q = returnQtys[item.productId] || 0;
      return sum + (q * item.price);
    }, 0)
  ) : 0;

  const handleSubmitRefund = () => {
    if (!selectedSale) return;
    const itemsToReturn = selectedSale.items
      ?.filter(item => (returnQtys[item.productId] || 0) > 0)
      .map(item => ({
        productId: item.productId,
        name: item.name,
        qty: returnQtys[item.productId],
        price: item.price,
        total: returnQtys[item.productId] * item.price
      }));

    if (!itemsToReturn || itemsToReturn.length === 0) {
      alert('Please select at least 1 item quantity to return.');
      return;
    }

    onProcessRefund(selectedSale.id, itemsToReturn, totalRefundAmount, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-rose-400" />
            <h3 className="font-bold text-base">Process Sales Return & Refund</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Invoice */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Enter Invoice Number (e.g. INV-20260915-001)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 transition"
            >
              Lookup
            </button>
          </form>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sale Details & Item Return Selector */}
          {selectedSale && (
            <div className="space-y-4 bg-slate-800/50 border border-slate-700 p-4 rounded-xl">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-700">
                <div>
                  <span className="text-slate-400">Invoice: </span>
                  <span className="font-bold font-mono text-white">{selectedSale.invoiceNo}</span>
                </div>
                <div className="text-slate-300">
                  {new Date(selectedSale.timestamp).toLocaleDateString()}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Select Items & Return Quantities</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedSale.items?.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 text-xs">
                      <div className="truncate max-w-[200px]">
                        <p className="font-medium text-slate-200 truncate">{item.name}</p>
                        <span className="text-[10px] text-slate-400">Purchased: {item.qty} pcs @ {currency} {item.price}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-slate-400">Return Qty:</span>
                        <input
                          type="number"
                          min="0"
                          max={item.qty}
                          value={returnQtys[item.productId] ?? 0}
                          onChange={(e) => handleQtyChange(item.productId, item.qty, e.target.value)}
                          className="w-14 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-center font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Return Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="Customer changed mind">Customer changed mind</option>
                  <option value="Defective / Damaged package">Defective / Damaged package</option>
                  <option value="Near expiry / Expired">Near expiry / Expired</option>
                  <option value="Wrong item picked">Wrong item picked</option>
                </select>
              </div>

              {/* Refund Total Summary */}
              <div className="p-3 bg-rose-950/30 border border-rose-900/50 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-rose-300">Refund Payout</span>
                  <p className="text-[11px] text-slate-400">Stock will be automatically restocked</p>
                </div>
                <div className="text-xl font-bold font-mono text-rose-400">
                  {currency} {totalRefundAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitRefund}
            disabled={!selectedSale || totalRefundAmount <= 0}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-lg shadow-rose-950 transition flex items-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Refund Payout</span>
          </button>
        </div>

      </div>
    </div>
  );
}
