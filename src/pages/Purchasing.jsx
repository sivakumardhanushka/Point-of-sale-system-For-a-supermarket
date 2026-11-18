import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  Trash2, 
  X, 
  FileText, 
  Clock 
} from 'lucide-react';
import BillToBillModal from '../components/BillToBillModal';

export default function Purchasing({ 
  suppliers, 
  purchases, 
  products, 
  onRecordPurchase, 
  onSaveSupplier, 
  onSettlePurchaseBill, 
  settings 
}) {
  const [activeSubTab, setActiveSubTab] = useState('bill_to_bill'); // bill_to_bill, orders, suppliers
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [activeSettlePurchase, setActiveSettlePurchase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New PO State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [isBillToBill, setIsBillToBill] = useState(true);
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [paymentStatus, setPaymentStatus] = useState('Credit'); // Paid, Credit, Partial
  const [paidAmountInput, setPaidAmountInput] = useState(0);
  const [poItems, setPoItems] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [itemQty, setItemQty] = useState(10);
  const [itemUnitCost, setItemUnitCost] = useState(products[0]?.costPrice || 100);
  const [poNotes, setPoNotes] = useState('');

  const currency = settings.currency || 'Rs.';

  const handleAddItemToPO = () => {
    const prd = products.find(p => p.id === selectedProductId);
    if (!prd) return;

    setPoItems(prev => [
      ...prev,
      {
        productId: prd.id,
        name: prd.name,
        qty: Number(itemQty),
        unitCost: Number(itemUnitCost),
        total: Number(itemQty) * Number(itemUnitCost)
      }
    ]);
  };

  const handleRemovePOItem = (index) => {
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const totalAmount = poItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmitPO = (e) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Please add at least 1 product item to the purchase order.');
      return;
    }

    if (isBillToBill && !supplierBillNo.trim()) {
      alert('Supplier Bill / Invoice Number is required for Bill-to-Bill purchases.');
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    let calculatedPaid = totalAmount;
    let calculatedBalanceDue = 0;

    if (paymentStatus === 'Credit') {
      calculatedPaid = 0;
      calculatedBalanceDue = totalAmount;
    } else if (paymentStatus === 'Partial') {
      calculatedPaid = Math.min(totalAmount, Math.max(0, Number(paidAmountInput) || 0));
      calculatedBalanceDue = Math.max(0, totalAmount - calculatedPaid);
    }

    const poData = {
      supplierId: selectedSupplierId,
      supplierName: supplier?.name || 'Supplier',
      purchaseType: isBillToBill ? 'bill-to-bill' : 'standard',
      supplierBillNo: isBillToBill ? supplierBillNo.trim() : '',
      items: poItems,
      totalAmount,
      paidAmount: calculatedPaid,
      balanceDue: calculatedBalanceDue,
      paymentStatus: calculatedBalanceDue <= 0.01 ? 'Paid' : (calculatedPaid > 0 ? 'Partial' : 'Credit'),
      notes: poNotes,
      date: billDate,
      dueDate: isBillToBill ? dueDate : ''
    };

    onRecordPurchase(poData);
    setIsNewPOOpen(false);
    setPoItems([]);
    setPoNotes('');
    setSupplierBillNo('');
    setPaidAmountInput(0);
    alert('Purchase inward recorded! Stock levels updated and supplier ledger adjusted.');
  };

  const handleSettleSubmit = (purchaseId, amount, payMethod, notes) => {
    onSettlePurchaseBill(purchaseId, amount, payMethod, notes);
    setActiveSettlePurchase(null);
  };

  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase();
    return (p.orderNo && p.orderNo.toLowerCase().includes(q)) ||
      (p.supplierBillNo && p.supplierBillNo.toLowerCase().includes(q)) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q));
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 space-y-4">
      
      {/* Top Header & Sub-tabs */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Supermarket Purchasing & Bill-to-Bill Procurement</h3>
            <p className="text-[11px] text-slate-400">Match supplier invoices bill-by-bill, track credit payables & replenish stock</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub-tabs Navigation */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1 text-xs">
            <button
              onClick={() => setActiveSubTab('bill_to_bill')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                activeSubTab === 'bill_to_bill' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bill-to-Bill Ledger ({purchases.length})
            </button>
            <button
              onClick={() => setActiveSubTab('orders')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                activeSubTab === 'orders' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Inwards ({purchases.length})
            </button>
            <button
              onClick={() => setActiveSubTab('suppliers')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                activeSubTab === 'suppliers' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Suppliers Directory ({suppliers.length})
            </button>
          </div>

          <div className="relative w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search bill no, supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {activeSubTab !== 'suppliers' ? (
            <button
              onClick={() => setIsNewPOOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Inward (Bill-to-Bill)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsNewSupplierOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: Bill to Bill Purchase Ledger */}
      {activeSubTab === 'bill_to_bill' && (
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-800/60 border-b border-slate-700/80 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">Bill-to-Bill Supplier Invoices & Outstanding Credit</span>
            </div>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-slate-400">Total Outstanding Payables:</span>
              <span className="font-bold text-amber-400 text-sm">
                {currency} {purchases.reduce((acc, p) => acc + Number(p.balanceDue || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-3">Supplier Bill No / PO</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Bill & Due Date</th>
                  <th className="p-3">Products Received</th>
                  <th className="p-3 text-right">Bill Total</th>
                  <th className="p-3 text-right">Amount Paid</th>
                  <th className="p-3 text-right">Balance Due</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPurchases.map((po) => {
                  const bal = Number(po.balanceDue || 0);
                  const isPaid = bal <= 0.01;
                  const isCredit = po.paymentStatus === 'Credit';
                  const isPartial = po.paymentStatus === 'Partial';

                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="font-bold font-mono text-emerald-400">
                          {po.supplierBillNo || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">Ref: {po.orderNo}</div>
                      </td>

                      <td className="p-3 font-medium text-slate-200">
                        {po.supplierName}
                      </td>

                      <td className="p-3">
                        <div className="text-slate-200">{po.date}</div>
                        {po.dueDate && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>Due: {po.dueDate}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="space-y-0.5 max-w-[200px]">
                          {po.items?.slice(0, 2).map((item, i) => (
                            <div key={i} className="text-[11px] text-slate-300 truncate">
                              • {item.name} <span className="font-mono text-slate-400">({item.qty} pcs)</span>
                            </div>
                          ))}
                          {po.items?.length > 2 && (
                            <span className="text-[10px] text-slate-500">+{po.items.length - 2} more items</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-white">
                        {currency} {Number(po.totalAmount).toFixed(2)}
                      </td>

                      <td className="p-3 text-right font-mono text-slate-300">
                        {currency} {Number(po.paidAmount || 0).toFixed(2)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold">
                        <span className={bal > 0 ? 'text-amber-400 font-black' : 'text-emerald-400'}>
                          {currency} {bal.toFixed(2)}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                            : isPartial
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {isPaid ? 'Paid' : (isPartial ? 'Partial' : 'Credit Due')}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {bal > 0 ? (
                          <button
                            onClick={() => setActiveSettlePurchase(po)}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded text-xs font-bold transition shadow cursor-pointer"
                          >
                            Settle Bill
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px] font-mono">Settled ✓</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Standard Orders View */}
      {activeSubTab === 'orders' && (
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-3">Order No & Date</th>
                  <th className="p-3">Supplier</th>
                  <th className="p-3">Supplier Bill No</th>
                  <th className="p-3">Products Received</th>
                  <th className="p-3 text-right">Total Invoice</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3">
                      <div className="font-bold font-mono text-slate-100">{po.orderNo}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{po.date}</span>
                      </div>
                    </td>

                    <td className="p-3 font-medium text-slate-200">
                      {po.supplierName}
                    </td>

                    <td className="p-3 font-mono font-semibold text-emerald-400">
                      {po.supplierBillNo || 'Direct Inward'}
                    </td>

                    <td className="p-3">
                      <div className="space-y-0.5">
                        {po.items?.map((item, i) => (
                          <div key={i} className="text-[11px] text-slate-300">
                            • {item.name} <span className="font-mono text-emerald-400">({item.qty} pcs @ {currency}{item.unitCost})</span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-white">
                      {currency} {Number(po.totalAmount).toFixed(2)}
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {po.paymentStatus || 'Received'}
                      </span>
                    </td>

                    <td className="p-3 text-slate-400 text-[11px]">
                      {po.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Suppliers Directory View */}
      {activeSubTab === 'suppliers' && (
        <div className="flex-1 grid grid-cols-3 gap-3 overflow-y-auto">
          {suppliers.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-sm text-white">{s.name}</h4>
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{s.company}</p>
                <div className="mt-2 space-y-1 text-xs text-slate-300">
                  <p>📞 Phone: <span className="font-mono">{s.phone}</span></p>
                  <p>✉ Email: <span className="text-slate-400">{s.email || 'N/A'}</span></p>
                  <p>📍 Address: <span className="text-slate-400">{s.address}</span></p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Outstanding Payables</span>
                <span className={`font-mono font-bold ${s.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {currency} {Number(s.balance).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Purchase Inward (Bill-to-Bill) Modal */}
      {isNewPOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Inward Stock Purchase & Bill Entry</h3>
                <p className="text-[11px] text-slate-400">Match supplier invoice and increase inventory quantities</p>
              </div>
              <button onClick={() => setIsNewPOOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPO} className="space-y-4 text-xs">
              
              {/* Purchase Mode Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <label className="flex items-center space-x-2 text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBillToBill}
                    onChange={(e) => setIsBillToBill(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  <span>Bill-to-Bill Purchase Mode</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono font-bold uppercase">
                  {isBillToBill ? 'Supplier Bill Tracking Active' : 'Direct Inward'}
                </span>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Select Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.company})</option>
                  ))}
                </select>
              </div>

              {/* Bill-to-Bill Details Grid */}
              {isBillToBill && (
                <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-xl grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-[11px] text-amber-300 block mb-0.5 font-semibold">Supplier Bill / Inv # *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. INV-2026-904"
                      value={supplierBillNo}
                      onChange={(e) => setSupplierBillNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">Bill Date</label>
                    <input
                      type="date"
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">Credit Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
                    />
                  </div>

                  {/* Payment Status Option */}
                  <div className="col-span-3 pt-1">
                    <label className="text-[11px] text-slate-300 block mb-1 font-semibold">Payment Settlement Terms</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'Credit', label: 'Credit (Bill-to-Bill Credit)' },
                        { id: 'Paid', label: 'Paid in Full (Cash/Bank)' },
                        { id: 'Partial', label: 'Partial Payment Now' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPaymentStatus(t.id)}
                          className={`p-2 rounded-lg border text-center font-semibold transition text-[11px] ${
                            paymentStatus === t.id
                              ? 'bg-amber-600/30 border-amber-500 text-amber-200 shadow'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentStatus === 'Partial' && (
                    <div className="col-span-3 pt-1">
                      <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">Amount Paid Today ({currency})</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        max={totalAmount}
                        value={paidAmountInput}
                        onChange={(e) => setPaidAmountInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono font-bold"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Add item to PO bar */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-2">
                <span className="font-semibold text-slate-200 block text-xs">Add Inward Received Items</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-3 sm:col-span-1">
                    <label className="text-[11px] text-slate-400 block mb-0.5">Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const p = products.find(prod => prod.id === e.target.value);
                        if (p) setItemUnitCost(p.costPrice);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Quantity Received</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-0.5">Unit Cost ({currency})</label>
                    <input
                      type="number"
                      step="any"
                      value={itemUnitCost}
                      onChange={(e) => setItemUnitCost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="text-right pt-1">
                  <button
                    type="button"
                    onClick={handleAddItemToPO}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs cursor-pointer"
                  >
                    + Add to Inward List
                  </button>
                </div>
              </div>

              {/* Items List in this PO */}
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {poItems.length === 0 ? (
                  <p className="text-slate-500 text-center py-2">No items added to this PO yet.</p>
                ) : (
                  poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{item.name}</span>
                        <span className="text-slate-400 text-[11px] ml-2">{item.qty} pcs @ {currency}{item.unitCost}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-400">{currency} {item.total.toFixed(2)}</span>
                        <button type="button" onClick={() => handleRemovePOItem(idx)} className="text-slate-500 hover:text-rose-400 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-semibold text-emerald-300 block">Total Purchase Value</span>
                  {isBillToBill && paymentStatus === 'Credit' && (
                    <span className="text-[10px] text-amber-400">Will be logged as outstanding balance to supplier</span>
                  )}
                </div>
                <span className="text-base font-bold font-mono text-white">
                  {currency} {totalAmount.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Notes / Delivery Challan Ref</label>
                <input
                  type="text"
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Inward consignment matched with gate pass #442"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPOOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={poItems.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg shadow cursor-pointer"
                >
                  Receive Stock & Record Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill-to-Bill Settlement Modal */}
      {activeSettlePurchase && (
        <BillToBillModal
          purchase={activeSettlePurchase}
          settings={settings}
          onClose={() => setActiveSettlePurchase(null)}
          onSettle={handleSettleSubmit}
        />
      )}

      {/* New Supplier Modal */}
      {isNewSupplierOpen && (
        <SupplierFormModal
          onClose={() => setIsNewSupplierOpen(false)}
          onSave={(data) => {
            onSaveSupplier(data);
            setIsNewSupplierOpen(false);
          }}
        />
      )}

    </div>
  );
}

function SupplierFormModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    balance: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('Supplier name and phone are required.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-white">Add New Supplier</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-slate-300 block mb-1">Contact Person Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1">Company Name</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1">Phone Number *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
            />
          </div>
          <div>
            <label className="text-slate-300 block mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer">Cancel</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer">Save Supplier</button>
          </div>
        </form>
      </div>
    </div>
  );
}
