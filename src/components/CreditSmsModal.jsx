import React, { useState } from 'react';
import { Smartphone, Send, Copy, Check, X, MessageSquare, AlertCircle, Share2, Loader2, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { useSms } from '../hooks/useSms';

export default function CreditSmsModal({ customer, creditAmount, invoiceNo, newBalance, settings, onClose }) {
  const currency = settings.currency || 'Rs.';
  const creditLimit = Number(customer?.creditLimit || 0);
  const availableCredit = Math.max(0, creditLimit - Number(newBalance || 0));

  const defaultTemplate = settings.smsTemplateCredit || 
    `Dear {customerName}, your credit purchase of {currency} {amount} on invoice {invoiceNo} was approved. New outstanding balance: {currency} {creditBalance} (Credit Limit: {currency} {creditLimit}). Available Credit: {currency} {availableCredit}. {storeName}.`;

  const generateMessage = () => {
    return defaultTemplate
      .replace(/{customerName}/g, customer?.name || 'Customer')
      .replace(/{amount}/g, Number(creditAmount || 0).toFixed(2))
      .replace(/{invoiceNo}/g, invoiceNo || 'N/A')
      .replace(/{creditBalance}/g, Number(newBalance || 0).toFixed(2))
      .replace(/{creditLimit}/g, creditLimit.toFixed(2))
      .replace(/{availableCredit}/g, availableCredit.toFixed(2))
      .replace(/{currency}/g, currency)
      .replace(/{storeName}/g, settings.storeName || 'ABC Supermarket');
  };

  const [messageText, setMessageText] = useState(generateMessage);
  const [mobileNumber, setMobileNumber] = useState(customer?.mobile || '');
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Twilio SMS API hook
  const { sendSms, loading: smsLoading, result: smsResult, error: smsError, reset: resetSms } = useSms();

  // Handle Twilio API SMS
  const handleSendApiSms = async () => {
    if (!mobileNumber.trim()) {
      alert('Please enter a valid customer mobile number.');
      return;
    }
    resetSms();
    await sendSms(mobileNumber, messageText);
  };

  // Dispatch Normal SMS using standard mobile OS sms: URI protocol
  const handleSendNormalSms = () => {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      alert('Please enter a valid customer mobile number.');
      return;
    }
    const smsUrl = `sms:${cleanMobile}?body=${encodeURIComponent(messageText)}`;
    window.location.href = smsUrl;
    setDispatched(true);
    setTimeout(() => setDispatched(false), 4000);
  };

  const handleSendWhatsApp = () => {
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!cleanMobile) {
      alert('Please enter a valid customer mobile number.');
      return;
    }
    const waUrl = `https://wa.me/${cleanMobile}?text=${encodeURIComponent(messageText)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-xs">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm">Credit Increase - SMS Notification</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Credit Overview Summary */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer</span>
              <span className="font-bold text-white text-sm">{customer?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">New Credit Balance</span>
              <span className="font-mono font-black text-amber-400 text-sm">
                {currency} {Number(newBalance || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Customer Mobile Field */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Recipient Mobile Number *</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => { setMobileNumber(e.target.value); resetSms(); }}
              placeholder="e.g. 0771234567"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">Sri Lankan numbers (07xxxxxxxx) auto-convert to +94 format.</p>
          </div>

          {/* SMS Body Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">SMS Text Content</label>
              <span className="text-[10px] text-slate-400 font-mono">{messageText.length} characters</span>
            </div>
            <textarea
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-emerald-500 font-sans"
            />
          </div>

          {/* Twilio API Status Banner */}
          {smsLoading && (
            <div className="p-2.5 bg-blue-950/80 border border-blue-700 text-blue-300 rounded-lg flex items-center space-x-2 animate-pulse">
              <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
              <span>Sending via Twilio API…</span>
            </div>
          )}
          {smsResult && !smsLoading && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-lg space-y-1">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">SMS dispatched via Twilio API!</span>
              </div>
              <p className="text-[10px] text-emerald-400/80 font-mono pl-6">
                SID: {smsResult.sid} &nbsp;|&nbsp; Status: {smsResult.status}
              </p>
            </div>
          )}
          {smsError && !smsLoading && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-700 text-rose-300 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Twilio API Error</span>
                <span className="text-[10px] text-rose-300/80">{smsError}</span>
              </div>
            </div>
          )}

          {/* Normal SMS dispatch notice */}
          {dispatched && (
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg flex items-center space-x-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Normal SMS launched via default messaging client!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Primary: Twilio API SMS */}
            <button
              onClick={handleSendApiSms}
              disabled={smsLoading}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-violet-950 transition cursor-pointer text-xs"
            >
              {smsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{smsLoading ? 'Sending via Twilio…' : 'Send SMS via Twilio API'}</span>
            </button>

            {/* Secondary row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleSendNormalSms}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-emerald-700/60 hover:bg-emerald-700 border border-emerald-600/60 text-emerald-200 rounded-lg font-semibold transition cursor-pointer"
                title="Open device SMS app"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Device SMS</span>
              </button>

              <button
                onClick={handleCopyText}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg font-semibold transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 bg-teal-900/60 hover:bg-teal-800/80 border border-teal-700/60 text-teal-200 rounded-lg font-semibold transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-teal-400" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
