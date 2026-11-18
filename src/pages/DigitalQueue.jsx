import React, { useState, useEffect } from 'react';
import { Smartphone, Send, CheckCircle, Clock, Wifi, WifiOff, RefreshCw, Trash2, ArrowRight } from 'lucide-react';

export default function DigitalQueue({ queue, onProcessQueue, settings }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const pendingCount = queue.filter(q => q.status === 'Pending').length;
  const sentCount = queue.filter(q => q.status === 'Sent').length;
  const currency = settings.currency || 'Rs.';

  const handleSyncNow = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onProcessQueue();
      setIsSyncing(false);
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Digital Mobile Bill Outbox & Queue</h3>
            <p className="text-[11px] text-slate-400">Offline-first bill dispatch engine: auto-delivers to customer WhatsApp/SMS when online</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isOnline 
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
              : 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{isOnline ? 'Network Online' : 'Network Offline (Queue Active)'}</span>
          </div>

          <button
            onClick={handleSyncNow}
            disabled={pendingCount === 0 || isSyncing}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync & Dispatch Outbox ({pendingCount})</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Pending Offline Dispatch</span>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {pendingCount} Bills
            </div>
            <span className="text-[10px] text-slate-400">Stored safely in local disk queue</span>
          </div>
          <div className="p-3 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/40">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Delivered Digital Bills</span>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {sentCount} Delivered
            </div>
            <span className="text-[10px] text-slate-400">Successfully sent to customers</span>
          </div>
          <div className="p-3 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/40">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Dispatch Success Rate</span>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {queue.length > 0 ? `${((sentCount / queue.length) * 100).toFixed(0)}%` : '100%'}
            </div>
            <span className="text-[10px] text-slate-400">Zero bill loss guaranteed</span>
          </div>
          <div className="p-3 bg-blue-950/60 text-blue-400 rounded-xl border border-blue-800/40">
            <Send className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-700">
              <tr>
                <th className="p-3">Invoice No</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Destination Mobile</th>
                <th className="p-3 text-right">Bill Total</th>
                <th className="p-3">Queued Time</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3">Sent Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    Digital bill queue is currently empty.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-slate-200">
                      {item.invoiceNo}
                    </td>
                    <td className="p-3 font-medium text-slate-300">
                      {item.customerName}
                    </td>
                    <td className="p-3 font-mono text-emerald-400 font-semibold">
                      {item.customerMobile}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {currency} {Number(item.total).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {new Date(item.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Sent'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {item.sentAt ? new Date(item.sentAt).toLocaleTimeString() : 'Awaiting sync'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
