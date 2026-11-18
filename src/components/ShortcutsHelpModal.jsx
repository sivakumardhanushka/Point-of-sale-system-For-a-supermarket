import React from 'react';
import { HelpCircle, X, Keyboard } from 'lucide-react';

export default function ShortcutsHelpModal({ onClose }) {
  const shortcuts = [
    { key: 'F1', desc: 'Switch to POS Cashier Billing Terminal' },
    { key: 'F2', desc: 'Switch to Inventory & Stock Management' },
    { key: 'F3', desc: 'Switch to Purchases & Supplier Orders' },
    { key: 'F4', desc: 'Switch to Customer CRM & Loyalty' },
    { key: 'F5', desc: 'Switch to Supermarket Expenses' },
    { key: 'F6', desc: 'Switch to Reports & Cashier Z-Shift Close' },
    { key: 'F7', desc: 'Switch to Digital Mobile Bills Queue' },
    { key: 'F8', desc: 'Switch to System Settings & Local Backup' },
    { key: 'F9 / Space', desc: 'Open Checkout & Payment Modal' },
    { key: 'F10', desc: 'Park / Hold Current Customer Cart' },
    { key: 'F11', desc: 'View Parked / Held Carts list' },
    { key: 'F12', desc: 'Open Return / Refund Dialog' },
    { key: 'Esc', desc: 'Clear barcode input / Close any active modal' },
    { key: 'Enter', desc: 'Submit scanned barcode / Confirm payment' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Cashier Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto space-y-2">
          {shortcuts.map((s, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60 text-xs"
            >
              <span className="text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2.5 py-1 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded shadow-inner text-[11px]">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
          >
            Got It (Esc)
          </button>
        </div>

      </div>
    </div>
  );
}
