import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { X } from 'lucide-react';

/**
 * PhoneSmsModal shows a QR code containing an sms: URI.
 * The user scans it with an Android phone to launch the SMS app with
 * the pre‑filled number and body. It also offers a direct "Send via Dialog API"
 * button that uses the credentials stored in Vite environment variables.
 */
export default function PhoneSmsModal({ mobileNumber, message, onClose }) {
  // UI state
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // QR‑code fallback URL
  const smsUrl = `sms:${mobileNumber.replace(/\D/g, '')}?body=${encodeURIComponent(message)}`;

  // Environment variables (Vite prefixes)
  const apiUrl = import.meta.env.VITE_DIALOG_API_URL;
  const authHeader = `Basic ${btoa(`${import.meta.env.VITE_DIALOG_USERNAME}:${import.meta.env.VITE_DIALOG_PASSWORD}`)}`;

  /** Send SMS through Dialog API */
  const sendSms = async () => {
    setSending(true);
    setStatus('idle');
    setErrorMsg('');
    try {
      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          to: mobileNumber.replace(/\D/g, ''),
          message,
        }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(`Dialog API error: ${resp.status} – ${err}`);
      }
      setStatus('success');
    } catch (e) {
      console.error('SMS send failed', e);
      setErrorMsg(e?.message ?? 'Unexpected error');
      setStatus('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold">Send SMS via Phone</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-slate-300 mb-3 text-sm">
          Scan this QR code with an Android phone. It will open the device SMS app with the number and message pre‑filled.
        </p>
        <div className="flex justify-center p-2 bg-white rounded">
          <QRCode value={smsUrl} size={180} level="M" />
        </div>
        <p className="mt-3 text-xs text-slate-500 break-all">{smsUrl}</p>
        {/* Dialog API button */}
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={sendSms}
            disabled={sending}
            className={`px-4 py-2 rounded bg-emerald-600 text-white text-sm transition ${sending ? 'opacity-60 cursor-not-allowed' : 'hover:bg-emerald-500'}`}
          >
            {sending ? 'Sending…' : 'Send via Dialog API'}
          </button>
        </div>
        {/* Status messages */}
        {status === 'success' && (
          <p className="mt-2 text-center text-emerald-400 text-sm">✅ SMS sent successfully!</p>
        )}
        {status === 'error' && (
          <p className="mt-2 text-center text-rose-400 text-sm">❌ Failed: {errorMsg}</p>
        )}
      </div>
    </div>
  );
}
