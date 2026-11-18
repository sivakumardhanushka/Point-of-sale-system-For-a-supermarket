import React, { useState } from 'react';
import { Crown, X, KeyRound, AlertCircle, ShieldCheck, Code2, Sparkles, CheckCircle } from 'lucide-react';
import { playSound } from '../db/storage';

export default function AdminOverrideModal({ users, onApproved, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const adminUsers = users.filter(u => u.role === 'admin' || u.role === 'manager');
  const dhanushUser = users.find(u => u.username === 'dhanush' || u.isCreator) || adminUsers.find(u => u.role === 'admin');
  const [selectedAdmin, setSelectedAdmin] = useState(dhanushUser || adminUsers[0]);

  const handleVerify = (e) => {
    e.preventDefault();
    const target = selectedAdmin || adminUsers.find(u => String(u.pin) === String(pin).trim());

    if (target && String(target.pin) === String(pin).trim()) {
      playSound('checkout');
      onApproved(target);
    } else {
      playSound('error');
      setError('Invalid Administrator / Developer PIN. Access Denied.');
      setPin('');
    }
  };

  const handleQuickMasterUnlock = () => {
    if (dhanushUser) {
      playSound('checkout');
      onApproved(dhanushUser);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-purple-600/70 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl shadow-purple-950/60 animate-in fade-in zoom-in-95 text-xs">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-purple-900/50">
              <Crown className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Master Admin & Developer Gate</span>
                <span className="text-[10px] bg-purple-950 border border-purple-700 text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">
                  EXCLUSIVE
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                System Architect: <strong className="text-purple-300">Dhanush (Software Engineer)</strong>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-slate-400 leading-relaxed">
          Authorized Administrator or Software Engineer clearance is required to unlock master controls, settings, inventory, and reports.
        </p>

        {/* Selected Admin Profile Pill */}
        <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-600/60 border border-purple-500 flex items-center justify-center font-bold text-white">
              {selectedAdmin?.username === 'dhanush' ? <Crown className="w-4 h-4 text-amber-300" /> : 'A'}
            </div>
            <div>
              <p className="font-bold text-white text-xs">{selectedAdmin?.name}</p>
              <p className="text-[10px] text-purple-300 font-mono">@{selectedAdmin?.username} • Root Admin Clearance</p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full">
            {selectedAdmin?.username === 'dhanush' ? 'Creator / Lead Dev' : 'Administrator'}
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 p-2 bg-rose-950/60 border border-rose-900/60 rounded-xl text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">
                Enter Master Security PIN (Dhanush PIN: 9999 • Admin: 1234)
              </label>
            </div>
            <input
              type="password"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError('');
              }}
              className="w-full bg-slate-950 border border-purple-700/80 rounded-xl px-3 py-2.5 text-center text-xl tracking-widest font-mono text-white focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
              placeholder="••••"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
            <button
              type="button"
              onClick={handleQuickMasterUnlock}
              className="px-3 py-2 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800 text-purple-200 rounded-xl font-bold flex items-center space-x-1.5 transition cursor-pointer"
              title="Quickly unlock with Dhanush Lead Engineer Credentials"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dhanush Master Key</span>
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-950 transition cursor-pointer flex items-center space-x-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorize & Enter</span>
              </button>
            </div>
          </div>
        </form>

        <div className="pt-2 text-center text-[10px] text-slate-500 font-mono flex items-center justify-center space-x-1">
          <Code2 className="w-3 h-3 text-purple-400" />
          <span>Engineered by Dhanush (Software Engineer)</span>
        </div>

      </div>
    </div>
  );
}
