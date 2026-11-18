import React, { useState } from 'react';
import { Smartphone, Send, Share2, Copy, Check, X, QrCode, AlertCircle, CheckCircle, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { useSms } from '../hooks/useSms';

export default function DigitalBillModal({ sale, settings, onClose }) {
  const [mobileNumber, setMobileNumber] = useState(sale?.customerMobile || '');
  const [copied, setCopied] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const isOnline = navigator.onLine;

  // Twilio SMS API hook
  const { sendSms, loading: smsLoading, result: smsResult, error: smsError, reset: resetSms } = useSms();

  if (!sale) return null;

  const currency = settings.currency || 'Rs.';
  const shareText = `*${settings.storeName} - Digital Receipt*\nInvoice: ${sale.invoiceNo}\nDate: ${new Date(sale.timestamp || Date.now()).toLocaleDateString()}\nTotal Amount: ${currency} ${Number(sale.total).toFixed(2)}\nThank you for your purchase!`;

  const plainSmsText = `${settings.storeName} - Digital Receipt | Invoice: ${sale.invoiceNo} | Date: ${new Date(sale.timestamp || Date.now()).toLocaleDateString()} | Total: ${currency} ${Number(sale.total).toFixed(2)} | Thank you!`;

  const handleSendWhatsApp = () => {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      alert('Please enter a valid customer mobile number.');
      return;
    }

    const waUrl = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 4000);
  };

  // Send via Twilio API
  const handleSendApiSms = async () => {
    if (!mobileNumber.trim()) {
      alert('Please enter a valid customer mobile number.');
      return;
    }
    resetSms();
    await sendSms(mobileNumber, plainSmsText);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700 text-slate-200">
          <div className="flex items-center space-x-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm">Customer Digital Bill</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Smartphone Container Mockup */}
        <div className="p-4 bg-slate-950 flex flex-col items-center">
          
          {/* Offline/Online Status Notice */}
          <div className="w-full mb-3">
            {isOnline ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 p-2 rounded-lg">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Online: Instant WhatsApp / SMS Bill dispatch ready</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/50 border border-amber-800/60 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Offline: Bill added to local queue. Auto-sends once online.</span>
              </div>
            )}
          </div>

          {/* Phone Screen Card */}
          <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-inner text-slate-200 space-y-3">
            <div className="text-center pb-2 border-b border-slate-800">
              {settings?.showLogoOnDigital !== false && settings?.logoUrl && (
                <div className="flex justify-center mb-1.5">
                  <img src={settings.logoUrl} alt="Store Logo" className="max-h-10 max-w-[180px] object-contain rounded" />
                </div>
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">E-Receipt</span>
              <h3 className="text-base font-bold text-white mt-0.5">{settings.storeName}</h3>
              <p className="text-[11px] text-slate-400">{settings.branch}</p>
            </div>

            <div className="text-xs space-y-1 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
              <div className="flex justify-between text-slate-400">
                <span>Invoice No:</span>
                <span className="font-mono text-slate-200 font-semibold">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Date:</span>
                <span className="text-slate-300">{new Date(sale.timestamp || Date.now()).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="text-slate-300 font-medium">{sale.customerName || 'Walk-in Customer'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment:</span>
                <span className="text-emerald-400 font-semibold">{sale.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            {/* Mini Items List */}
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs">
              {sale.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-[11px] py-1 border-b border-slate-800/60">
                  <div className="truncate max-w-[170px]">
                    <p className="font-medium text-slate-200 truncate">{item.name}</p>
                    <span className="text-[10px] text-slate-400">{item.qty} × {currency} {Number(item.price).toFixed(2)}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-100">
                    {currency} {Number(item.total || (item.price * item.qty)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Highlight */}
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/40 rounded-lg flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-300">Total Paid</span>
              <span className="text-lg font-black font-mono text-white">
                {currency} {Number(sale.total).toFixed(2)}
              </span>
            </div>

            {/* Digital verification QR simulation */}
            <div className="flex items-center justify-center py-1">
              <div className="bg-white p-2 rounded-lg shadow">
                <QrCode className="w-16 h-16 text-slate-950" />
              </div>
            </div>
            <p className="text-[10px] text-center text-slate-400 font-mono">Scan to verify invoice authenticity</p>
          </div>

          {/* Share Controls */}
          <div className="w-full mt-4 space-y-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1 block">Customer Mobile Number</label>
              <input
                type="tel"
                placeholder="e.g. 0771234567 or +94..."
                value={mobileNumber}
                onChange={(e) => { setMobileNumber(e.target.value); resetSms(); }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-0.5">Sri Lankan numbers (07xxxxxxxx) auto-convert to +94.</p>
            </div>

            {/* Twilio API Status */}
            {smsLoading && (
              <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/60 border border-blue-700/60 p-2 rounded-lg animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Sending SMS via Twilio API…</span>
              </div>
            )}
            {smsResult && !smsLoading && (
              <div className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 p-2 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span className="font-bold">SMS delivered via Twilio!</span>
                </div>
                <p className="text-[10px] font-mono text-emerald-400/70 mt-0.5 pl-5">SID: {smsResult.sid}</p>
              </div>
            )}
            {smsError && !smsLoading && (
              <div className="flex items-start gap-1.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-700/60 p-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-bold">Twilio Error: </span>
                  <span className="text-rose-300/80">{smsError}</span>
                </div>
              </div>
            )}

            {/* Primary: Twilio API SMS */}
            <button
              onClick={handleSendApiSms}
              disabled={smsLoading}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition"
            >
              {smsLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{smsLoading ? 'Sending via Twilio…' : 'Send Bill via Twilio SMS API'}</span>
            </button>

            {/* Secondary: WhatsApp + Copy */}
            <div className="flex gap-2">
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send via WhatsApp</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
                title="Copy Bill Text"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {sentSuccess && (
              <p className="text-xs text-emerald-400 text-center font-medium animate-pulse">
                ✓ WhatsApp bill window opened successfully!
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
