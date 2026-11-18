import React from 'react';
import { PauseCircle, Play, Trash2, X, Clock, ShoppingCart } from 'lucide-react';

export default function HoldBillsModal({ holdBills, onResumeBill, onDeleteBill, onClose, currency = 'Rs.' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <PauseCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Parked / Held Bills ({holdBills.length})</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Held Bills */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2.5">
          {holdBills.length === 0 ? (
            <div className="text-center py-10 text-slate-500 space-y-2">
              <ShoppingCart className="w-10 h-10 mx-auto opacity-40" />
              <p className="text-sm">No parked bills currently on hold.</p>
              <p className="text-xs text-slate-600">Use "Hold (F8)" on active checkout to park a customer cart.</p>
            </div>
          ) : (
            holdBills.map((bill) => (
              <div 
                key={bill.id}
                className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between hover:border-slate-600 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-200 text-sm">
                      {bill.customer?.name || 'Walk-in Customer'}
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {bill.cart?.length} items
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(bill.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      {currency} {Number(bill.total).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate max-w-xs">
                    {bill.cart?.map(i => `${i.name} (x${i.qty})`).join(', ')}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onDeleteBill(bill.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/80 rounded-lg transition"
                    title="Delete Held Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onResumeBill(bill)}
                    className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Resume Cart</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
