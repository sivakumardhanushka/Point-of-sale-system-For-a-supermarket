import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Award, 
  Phone, 
  Mail, 
  X, 
  ShoppingBag, 
  CreditCard, 
  Receipt,
  Edit,
  History,
  Send
} from 'lucide-react';
import CreditIdCardModal from '../components/CreditIdCardModal';
import CreditSmsModal from '../components/CreditSmsModal';
import CreditSettleModal from '../components/CreditSettleModal';

export default function Customers({ customers, sales, onSaveCustomer, onSettleCustomerCredit, settings }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // all, credit, has_balance
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState(null);
  const [viewLedgerCustomer, setViewLedgerCustomer] = useState(null);

  // Modals for credit ID card, SMS, and settlement
  const [activeIdCardCustomer, setActiveIdCardCustomer] = useState(null);
  const [activeSmsCustomer, setActiveSmsCustomer] = useState(null);
  const [activeSettleCustomer, setActiveSettleCustomer] = useState(null);

  const currency = settings.currency || 'Rs.';

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.mobile.includes(searchQuery) ||
      (c.creditBarcode && c.creditBarcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'credit') return c.creditAllowed && c.id !== 'cust-walkin';
    if (filterTab === 'has_balance') return Number(c.creditBalance || 0) > 0;
    return true;
  });

  const customerSales = viewHistoryCustomer 
    ? sales.filter(s => s.customerId === viewHistoryCustomer.id)
    : [];

  const handleSettleCreditSubmit = (customerId, amount, paymentMethod, notes) => {
    onSettleCustomerCredit(customerId, amount, paymentMethod, notes);
    setActiveSettleCustomer(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 space-y-4">
      
      {/* Top Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-950/60 text-purple-400 border border-purple-800/40 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Customer CRM, Credit Limits & Khata Ledger</h3>
            <p className="text-[11px] text-slate-400">Manage buyer credit limits, generate barcode ID cards, normal SMS alerts & settlement receipts</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Sub-Tabs */}
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1 text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                filterTab === 'all' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterTab('credit')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                filterTab === 'credit' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Credit Members ({customers.filter(c => c.creditAllowed && c.id !== 'cust-walkin').length})
            </button>
            <button
              onClick={() => setFilterTab('has_balance')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                filterTab === 'has_balance' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Outstanding Dues ({customers.filter(c => Number(c.creditBalance || 0) > 0).length})
            </button>
          </div>

          <div className="relative w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by name, mobile, barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <button
            onClick={() => {
              setEditingCustomer(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto">
        {filteredCustomers.map(cust => {
          const isWalkin = cust.id === 'cust-walkin';
          const creditAllowed = cust.creditAllowed && !isWalkin;
          const creditLimit = Number(cust.creditLimit || 0);
          const creditBalance = Number(cust.creditBalance || 0);
          const availableCredit = Math.max(0, creditLimit - creditBalance);
          const isOverLimit = creditBalance > creditLimit && creditLimit > 0;

          return (
            <div 
              key={cust.id} 
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between space-y-3 transition ${
                creditBalance > 0 
                  ? 'border-amber-900/60 hover:border-amber-500/60' 
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <span>{cust.name}</span>
                      {creditAllowed && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                          Khata
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {cust.id}</span>
                      {cust.creditBarcode && (
                        <span className="text-[10px] text-amber-400/90 font-mono font-bold bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                          {cust.creditBarcode}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {cust.points > 0 && (
                      <div className="px-2 py-0.5 bg-purple-950/60 border border-purple-800/60 text-purple-300 rounded text-[11px] font-bold flex items-center space-x-1">
                        <Award className="w-3 h-3 text-purple-400" />
                        <span>{cust.points} pts</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setEditingCustomer(cust);
                        setIsAddModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
                      title="Edit Customer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-2.5 space-y-1 text-xs text-slate-300">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{cust.mobile || 'No mobile'}</span>
                  </p>
                  {cust.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-400">{cust.email}</span>
                    </p>
                  )}
                  {cust.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-800/40 p-1 rounded">
                      "{cust.notes}"
                    </p>
                  )}
                </div>

                {/* Credit Facility Card Section */}
                {creditAllowed && (
                  <div className="mt-3 bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 space-y-2">
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">Credit Limit</span>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {currency} {creditLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-x border-slate-800">
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">Current Balance</span>
                        <span className={`text-xs font-mono font-bold ${creditBalance > 0 ? (isOverLimit ? 'text-rose-400 font-black' : 'text-amber-400 font-black') : 'text-slate-400'}`}>
                          {currency} {creditBalance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 block">Available</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {currency} {availableCredit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Badges for Credit Buyer */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      {/* Barcode ID Card Button */}
                      <button
                        onClick={() => setActiveIdCardCustomer(cust)}
                        className="flex items-center space-x-1 px-2 py-0.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 rounded font-semibold transition cursor-pointer"
                        title="Generate Printable ID Card & Barcode"
                      >
                        <CreditCard className="w-3 h-3 text-amber-400" />
                        <span>Barcode ID Pass</span>
                      </button>

                      {/* Normal SMS Alert Button */}
                      <button
                        onClick={() => setActiveSmsCustomer(cust)}
                        className="flex items-center space-x-1 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-semibold transition cursor-pointer"
                        title="Send Balance SMS Notification"
                      >
                        <Send className="w-3 h-3 text-emerald-400" />
                        <span>Send SMS</span>
                      </button>

                      {/* Settle Khata Button */}
                      {creditBalance > 0 && (
                        <button
                          onClick={() => setActiveSettleCustomer(cust)}
                          className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60 rounded font-bold transition cursor-pointer"
                          title="Record Customer Settlement Payment"
                        >
                          <Receipt className="w-3 h-3 text-emerald-400" />
                          <span>Settle Khata</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Total Spend & History */}
              <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block uppercase">Lifetime Sales</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {currency} {Number(cust.totalSpent || 0).toLocaleString()}
                  </span>
                </div>

                <div className="flex space-x-1">
                  {cust.creditHistory && cust.creditHistory.length > 0 && (
                    <button
                      onClick={() => setViewLedgerCustomer(cust)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                      title="Credit Ledger Statement"
                    >
                      <History className="w-3 h-3" />
                      <span>Ledger</span>
                    </button>
                  )}

                  <button
                    onClick={() => setViewHistoryCustomer(cust)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3 h-3" />
                    <span>Invoices</span>
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">
                {editingCustomer ? 'Edit Customer & Credit Settings' : 'Add New Customer Profile'}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <CustomerForm
              customer={editingCustomer}
              onClose={() => setIsAddModalOpen(false)}
              currency={currency}
              onSave={(data) => {
                onSaveCustomer(data);
                setIsAddModalOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {viewHistoryCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-sm text-white">Purchase History: {viewHistoryCustomer.name}</h3>
                <p className="text-slate-400 text-[11px]">Mobile: {viewHistoryCustomer.mobile}</p>
              </div>
              <button onClick={() => setViewHistoryCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {customerSales.length === 0 ? (
                <p className="text-slate-500 text-center py-6">No historical sales invoices found for this customer.</p>
              ) : (
                customerSales.map(s => (
                  <div key={s.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div className="flex justify-between font-mono font-bold text-slate-200">
                      <span>{s.invoiceNo}</span>
                      <span className="text-emerald-400">{currency} {Number(s.total).toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex justify-between">
                      <span>{new Date(s.timestamp).toLocaleString()}</span>
                      <span className={`uppercase font-semibold ${s.paymentMethod === 'Credit' ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {s.paymentMethod}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {s.items?.map(i => `${i.name} (x${i.qty})`).join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-800">
              <button
                onClick={() => setViewHistoryCustomer(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Ledger / Statement Modal */}
      {viewLedgerCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-sm text-white">Khata / Credit Statement: {viewLedgerCustomer.name}</h3>
                <p className="text-slate-400 text-[11px]">Barcode ID: {viewLedgerCustomer.creditBarcode || viewLedgerCustomer.id}</p>
              </div>
              <button onClick={() => setViewLedgerCustomer(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center font-mono">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-sans block">Credit Limit</span>
                <span className="font-bold text-amber-400">{currency} {Number(viewLedgerCustomer.creditLimit || 0).toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-sans block">Current Due</span>
                <span className="font-black text-rose-400 text-sm">{currency} {Number(viewLedgerCustomer.creditBalance || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {(!viewLedgerCustomer.creditHistory || viewLedgerCustomer.creditHistory.length === 0) ? (
                <p className="text-slate-500 text-center py-6">No credit transactions recorded yet.</p>
              ) : (
                viewLedgerCustomer.creditHistory.map(entry => {
                  const isCharge = entry.type === 'CHARGE';
                  return (
                    <div key={entry.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isCharge ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {isCharge ? 'Charge' : 'Payment'}
                          </span>
                          <span className="font-mono text-slate-200 font-semibold">{entry.invoiceNo}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{entry.date} - {entry.notes || 'Transaction'}</p>
                      </div>

                      <div className="text-right font-mono">
                        <span className={`font-bold block ${isCharge ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {isCharge ? '+' : '-'}{currency} {Number(entry.amount).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-400">Bal: {currency}{Number(entry.balanceAfter).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveIdCardCustomer(viewLedgerCustomer);
                  setViewLedgerCustomer(null);
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center space-x-1"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>View ID Barcode Pass</span>
              </button>

              <button
                onClick={() => setViewLedgerCustomer(null)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credit ID Card Modal */}
      {activeIdCardCustomer && (
        <CreditIdCardModal
          customer={activeIdCardCustomer}
          settings={settings}
          onClose={() => setActiveIdCardCustomer(null)}
        />
      )}

      {/* Normal SMS Modal */}
      {activeSmsCustomer && (
        <CreditSmsModal
          customer={activeSmsCustomer}
          creditAmount={0}
          invoiceNo="STATEMENT"
          newBalance={activeSmsCustomer.creditBalance}
          settings={settings}
          onClose={() => setActiveSmsCustomer(null)}
        />
      )}

      {/* Settle Credit Modal */}
      {activeSettleCustomer && (
        <CreditSettleModal
          customer={activeSettleCustomer}
          settings={settings}
          onClose={() => setActiveSettleCustomer(null)}
          onSettle={handleSettleCreditSubmit}
        />
      )}

    </div>
  );
}

function CustomerForm({ customer, onClose, onSave, currency }) {
  const [formData, setFormData] = useState({
    id: customer?.id || '',
    name: customer?.name || '',
    mobile: customer?.mobile || '',
    email: customer?.email || '',
    notes: customer?.notes || '',
    points: customer?.points || 0,
    creditAllowed: customer?.creditAllowed !== false,
    creditLimit: customer?.creditLimit !== undefined ? customer.creditLimit : 25000,
    creditBalance: customer?.creditBalance || 0,
    creditBarcode: customer?.creditBarcode || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      alert('Customer name and mobile are required.');
      return;
    }
    // Auto-generate barcode if missing
    const preparedData = {
      ...formData,
      creditBarcode: formData.creditBarcode.trim() || `CR-${formData.mobile.slice(-4) || Date.now().toString().slice(-4)}`
    };
    onSave(preparedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-slate-300 block mb-1">Customer Full Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
        />
      </div>

      <div>
        <label className="text-slate-300 block mb-1">Mobile Number (Digital Bill & Normal SMS) *</label>
        <input
          type="tel"
          required
          placeholder="e.g. 0771234567"
          value={formData.mobile}
          onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-slate-300 block mb-1">Email (Optional)</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
          />
        </div>

        <div>
          <label className="text-slate-300 block mb-1">Loyalty Points</label>
          <input
            type="number"
            value={formData.points}
            onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
          />
        </div>
      </div>

      {/* Credit Facility Section */}
      <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-slate-200 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={formData.creditAllowed}
              onChange={(e) => setFormData({ ...formData, creditAllowed: e.target.checked })}
              className="w-4 h-4 accent-amber-500 rounded"
            />
            <span>Enable Credit / Khata Facility</span>
          </label>
          <span className="text-[10px] text-amber-400 font-semibold uppercase">Credit Buyer</span>
        </div>

        {formData.creditAllowed && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">Credit Limit ({currency})</label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.creditLimit}
                onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">Credit Barcode ID</label>
              <input
                type="text"
                placeholder="e.g. CR-1001"
                value={formData.creditBarcode}
                onChange={(e) => setFormData({ ...formData, creditBarcode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] text-slate-300 block mb-0.5 font-semibold">Current Balance Due ({currency})</label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.creditBalance}
                onChange={(e) => setFormData({ ...formData, creditBalance: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white font-mono font-bold"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="text-slate-300 block mb-1">Notes</label>
        <input
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
          placeholder="e.g. Preferred discounts, VIP credit customer"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
        <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded cursor-pointer">
          Cancel
        </button>
        <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer">
          Save Customer
        </button>
      </div>
    </form>
  );
}
