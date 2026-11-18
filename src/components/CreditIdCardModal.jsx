import React, { useRef } from 'react';
import { CreditCard, Printer, X, Download, ShieldCheck, Sparkles, Phone, Award } from 'lucide-react';
import Barcode from './Barcode';
import { DEFAULT_STORE_LOGO_SVG } from '../assets/storeLogo';

export default function CreditIdCardModal({ customer, settings, onClose }) {
  const cardRef = useRef(null);

  if (!customer) return null;

  const currency = settings.currency || 'Rs.';
  const barcodeValue = customer.creditBarcode || `CR-${customer.id.replace('cust-', '')}`;
  const creditLimit = Number(customer.creditLimit || 0);
  const currentBalance = Number(customer.creditBalance || 0);
  const availableCredit = Math.max(0, creditLimit - currentBalance);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Credit Buyer Digital ID Card & Barcode</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 flex flex-col items-center">
          
          {/* Instructions Notice */}
          <div className="w-full bg-amber-950/40 border border-amber-800/50 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-amber-200">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Cashiers can scan this card's barcode directly using any POS USB barcode scanner to instantly select this credit buyer at checkout.
            </span>
          </div>

          {/* Printable Credit Card Component (CR-80 Format) */}
          <div 
            id="credit-buyer-id-card-print"
            ref={cardRef}
            className="w-[370px] bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white border-2 border-amber-500/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden select-none"
            style={{
              boxShadow: '0 20px 40px -15px rgba(245, 158, 11, 0.25), 0 0 20px 0 rgba(0,0,0,0.7)'
            }}
          >
            {/* Background metallic pattern watermark */}
            <div className="absolute -right-12 -bottom-12 w-44 h-44 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />

            {/* Top Bar: Store Logo & Badge */}
            <div className="flex items-start justify-between border-b border-amber-500/30 pb-3 mb-3">
              <div>
                <h4 className="font-black text-sm tracking-wider text-amber-400 uppercase">
                  {settings.storeName || 'ABC SUPERMARKET'}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">{settings.branch || 'Main Branch'}</p>
              </div>

              <div className="flex items-center space-x-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>CREDIT PASS</span>
              </div>
            </div>

            {/* Card Middle: Customer Details */}
            <div className="flex items-center gap-3.5 mb-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0">
                {customer.name?.slice(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 truncate">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Credit Member</span>
                <h5 className="font-bold text-sm text-white truncate">{customer.name}</h5>
                <p className="text-[11px] font-mono text-slate-300 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-amber-400/80" />
                  <span>{customer.mobile || 'No Mobile'}</span>
                </p>
              </div>
            </div>

            {/* Credit Limit & Balance Box */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 mb-3 text-center">
              <div>
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Credit Limit</span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {currency} {creditLimit.toLocaleString()}
                </span>
              </div>
              <div className="border-l border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Available Credit</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {currency} {availableCredit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Scannable Barcode */}
            <div className="bg-white rounded-xl p-2 flex flex-col items-center justify-center shadow-inner">
              <Barcode 
                value={barcodeValue} 
                height={40} 
                scale={1.8} 
                showText={true} 
                color="#000000" 
                bgColor="#ffffff"
              />
            </div>

            {/* Card Footer */}
            <div className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-400">
              <span className="font-mono">ID: {customer.id}</span>
              <span className="font-mono">ISSUE: {new Date().toISOString().slice(0, 10)}</span>
            </div>

          </div>

          {/* Quick Info text */}
          <p className="text-xs text-slate-400 text-center max-w-sm">
            Press <strong className="text-slate-200">Print Card</strong> to generate standard customer PVC ID badge or physical receipt card.
          </p>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-t border-slate-700 flex items-center justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg shadow-amber-950/40 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Credit Card</span>
          </button>
        </div>

      </div>
    </div>
  );
}
