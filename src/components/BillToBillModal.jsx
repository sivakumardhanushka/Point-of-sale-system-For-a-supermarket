import React, { useState } from 'react';
import { DollarSign, CheckCircle2, X, Building2, Calendar, FileText } from 'lucide-react';

export default function BillToBillModal({ purchase, settings, onClose, onSettle }) {
  const currency = settings?.currency || 'Rs.';
  const balanceDue = Number(purchase?.balanceDue || 0);
  const [payAmount, setPayAmount] = useState(balanceDue);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount greater than 0.');
      return;
    }
    onSettle(purchase.id, amount, payMethod, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Settle Supplier Purchase Bill</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Bill Info */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Supplier</span>
                <h4 className="font-bold text-sm text-white">{purchase?.supplierName}</h4>
                <p className="text-[11px] font-mono text-emerald-400">Supplier Bill #{purchase?.supplierBillNo || purchase?.orderNo}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Balance Due</span>
                <div className="text-base font-black font-mono text-amber-400">
                  {currency} {balanceDue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <div>Total: {currency} {Number(purchase?.totalAmount || 0).toFixed(2)}</div>
              <div className="text-right">Already Paid: {currency} {Number(purchase?.paidAmount || 0).toFixed(2)}</div>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Payment Amount to Settle ({currency}) *</label>
            <input
              type="number"
              step="any"
              min="1"
              max={balanceDue}
              required
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => setPayAmount(balanceDue)}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium"
              >
                Pay Full ({currency}{balanceDue.toFixed(2)})
              </button>
              <button
                type="button"
                onClick={() => setPayAmount(Math.round(balanceDue / 2))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium"
              >
                Pay Half ({currency}{Math.round(balanceDue / 2).toFixed(2)})
              </button>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Disbursement Mode</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="Bank Transfer">Bank Transfer / EFT</option>
              <option value="Cheque">Supplier Cheque</option>
              <option value="Cash">Cash Voucher</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Voucher / Transaction Reference</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bank Ref #99212 / Cheque #8812"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
            />
          </div>

          {/* Remaining Balance After Pay */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl flex justify-between items-center">
            <span className="text-slate-300 font-semibold">Remaining Bill Balance</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {currency} {Math.max(0, balanceDue - (Number(payAmount) || 0)).toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Record Bill Payment</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
