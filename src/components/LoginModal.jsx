import React, { useState } from 'react';
import { Lock, Shield, User, KeyRound, AlertCircle, ShoppingCart, Crown, Code2, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { playSound } from '../db/storage';

export default function LoginModal({ users, settings, onLoginSuccess }) {
  // Separate Portal state: 'cashier' for POS staff, 'admin' for Dhanush / Master Admin
  const [activePortal, setActivePortal] = useState('cashier'); // 'cashier' | 'admin'

  // Filter users based on portal
  const cashierUsers = users.filter(u => u.role !== 'admin');
  const adminUsers = users.filter(u => u.role === 'admin');

  // Find Dhanush creator user or default admin
  const dhanushUser = users.find(u => u.username === 'dhanush' || u.isCreator) || adminUsers[0];

  const [selectedUser, setSelectedUser] = useState(() => cashierUsers[0] || users[0]);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const switchPortal = (portal) => {
    setActivePortal(portal);
    setPinInput('');
    setErrorMsg('');
    if (portal === 'admin') {
      setSelectedUser(dhanushUser || adminUsers[0]);
    } else {
      setSelectedUser(cashierUsers[0] || users[0]);
    }
  };

  const handleNumClick = (digit) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + digit);
      setErrorMsg('');
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMsg('');
  };

  const handleVerify = (e) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    if (selectedUser.active === false) {
      playSound('error');
      setErrorMsg('This staff account is deactivated. Contact Administrator.');
      setPinInput('');
      return;
    }

    if (String(selectedUser.pin) === String(pinInput).trim()) {
      playSound('checkout');
      onLoginSuccess(selectedUser);
    } else {
      playSound('error');
      setErrorMsg('Incorrect PIN. Please try again.');
      setPinInput('');
    }
  };

  const isAdminPortal = activePortal === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4">
      <div className={`border rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95 ${
        isAdminPortal 
          ? 'bg-slate-900 border-purple-600/60 shadow-purple-950/50' 
          : 'bg-slate-900 border-slate-700 shadow-emerald-950/50'
      }`}>
        
        {/* Top Header */}
        <div className={`p-5 border-b flex items-center justify-between transition-colors ${
          isAdminPortal 
            ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-purple-800/60' 
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg ${
              isAdminPortal 
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500 shadow-purple-900/50' 
                : 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-900/50'
            }`}>
              {isAdminPortal ? <Crown className="w-6 h-6 text-amber-300" /> : 'S'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{settings.storeName || 'ABC SUPERMARKET'}</h2>
                {isAdminPortal && (
                  <span className="text-[10px] bg-purple-900/80 border border-purple-600 text-purple-200 px-2 py-0.5 rounded-full font-bold">
                    Master Admin Gate
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isAdminPortal 
                  ? 'System Architect: Dhanush (Software Engineer) • Exclusive Admin Clearance' 
                  : `${settings.branch || 'Main City Branch'} • POS Terminal Access`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            <Lock className={`w-3.5 h-3.5 ${isAdminPortal ? 'text-purple-400' : 'text-emerald-400'}`} />
            <span>{isAdminPortal ? 'Admin Gate' : 'Register Locked'}</span>
          </div>
        </div>

        {/* Separate Access Door Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/80 text-xs font-bold">
          <button
            type="button"
            onClick={() => switchPortal('cashier')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 transition cursor-pointer border-b-2 ${
              !isAdminPortal
                ? 'bg-slate-900 text-emerald-300 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>1. Cashier & Terminal Staff</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {cashierUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => switchPortal('admin')}
            className={`flex-1 py-3 px-4 flex items-center justify-center space-x-2 transition cursor-pointer border-b-2 ${
              isAdminPortal
                ? 'bg-purple-950/40 text-purple-200 border-purple-500 shadow-inner'
                : 'text-slate-400 hover:text-purple-300 border-transparent hover:bg-slate-900/50'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>2. Dhanush / Master Admin Portal</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold font-mono">
              ROOT
            </span>
          </button>
        </div>

        {/* Content: Left user profiles selector, Right PIN keypad */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          {/* Left: User Profiles for the active portal */}
          <div className="p-6 space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isAdminPortal ? '👑 Master Administrator Identity' : '👤 Select Cashier Profile'}
              </span>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdminPortal 
                  ? 'High-security root access reserved for the creator & administrators' 
                  : 'Select your terminal cashier account to begin billing'}
              </p>
            </div>

            {/* List of profiles according to current portal */}
            <div className="space-y-2">
              {(isAdminPortal ? adminUsers : cashierUsers).map(u => {
                const isSelected = selectedUser?.id === u.id;
                const isDhanush = u.username === 'dhanush' || u.isCreator;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(u);
                      setPinInput('');
                      setErrorMsg('');
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                      isSelected
                        ? isAdminPortal 
                          ? 'bg-purple-950/60 border-purple-500 text-white shadow-lg shadow-purple-950'
                          : 'bg-emerald-600/20 border-emerald-500 text-white shadow-md shadow-emerald-950'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDhanush 
                          ? 'bg-gradient-to-tr from-purple-600 to-amber-500 text-white ring-2 ring-amber-400/50' 
                          : isAdminPortal 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {isDhanush ? <Crown className="w-4 h-4 text-amber-200" /> : (u.name?.[0] || 'U')}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1.5">
                          <p className="font-semibold text-xs truncate text-white">{u.name}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono">
                          @{u.username} {isDhanush && '• Creator / Architect'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        isDhanush
                          ? 'bg-gradient-to-r from-purple-900 to-amber-900 border border-amber-600 text-amber-200'
                          : isAdminPortal 
                          ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                          : 'bg-slate-900 text-emerald-400'
                      }`}>
                        {isDhanush ? 'CREATOR ROOT' : u.role}
                      </span>
                      {u.active === false && (
                        <span className="text-[9px] text-rose-400 font-semibold">Disabled</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Demo PIN Cheat Sheet */}
            <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
              isAdminPortal 
                ? 'bg-purple-950/30 border-purple-900/60 text-purple-300' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400'
            }`}>
              <p className="font-semibold text-slate-200">
                {isAdminPortal ? '👑 Master Admin Passwords / PINs:' : 'Default Cashier PINs:'}
              </p>
              {isAdminPortal ? (
                <>
                  <p>• 👑 <span className="text-amber-300 font-semibold">Dhanush (Software Engineer):</span> PIN <span className="font-mono text-amber-400 font-bold tracking-wider">9999</span></p>
                  <p>• Store Administrator: PIN <span className="font-mono text-purple-300 font-bold tracking-wider">1234</span></p>
                </>
              ) : (
                <>
                  <p>• Cashier 01 (Priya): PIN <span className="font-mono text-emerald-400 font-bold">1111</span></p>
                  <p>• Cashier 02 (Kamal): PIN <span className="font-mono text-emerald-400 font-bold">2222</span></p>
                  <p>• Store Manager (Sunil): PIN <span className="font-mono text-blue-400 font-bold">5678</span></p>
                </>
              )}
            </div>
          </div>

          {/* Right: PIN Keypad */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {isAdminPortal ? 'Enter Master Security PIN' : 'Enter Security PIN'}
                </span>
                <span className={`text-xs font-semibold font-mono ${isAdminPortal ? 'text-purple-300' : 'text-emerald-400'}`}>
                  {selectedUser?.name}
                </span>
              </div>

              {/* PIN display bullets */}
              <div className="mt-3 bg-slate-950 border border-slate-700 rounded-xl p-3 flex items-center justify-center space-x-3 h-12 shadow-inner">
                {[0, 1, 2, 3].map(index => (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      pinInput.length > index
                        ? isAdminPortal 
                          ? 'bg-purple-400 scale-110 shadow-md shadow-purple-400/50' 
                          : 'bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50'
                        : 'border-2 border-slate-700 bg-transparent'
                    }`}
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="mt-2 flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/50 border border-rose-900/60 p-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumClick(String(num))}
                  className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-lg font-bold font-mono text-white transition shadow cursor-pointer"
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="py-3 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase transition"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={() => handleNumClick('0')}
                className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-lg font-bold font-mono text-white transition shadow cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase transition"
              >
                ⌫
              </button>
            </div>

            {/* Unlock Button */}
            <button
              type="button"
              onClick={handleVerify}
              disabled={pinInput.length === 0}
              className={`w-full py-3 text-white font-bold rounded-xl shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer disabled:opacity-40 ${
                isAdminPortal 
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-950' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-950'
              }`}
            >
              {isAdminPortal ? <Crown className="w-4 h-4 text-amber-300" /> : <KeyRound className="w-4 h-4" />}
              <span>{isAdminPortal ? 'Authorize Master Admin Access' : 'Unlock Register & Sign In'}</span>
            </button>
          </div>

        </div>

        {/* Modal Developer Credit Footer */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center space-x-2">
            <Code2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Architected & Engineered by <strong className="text-purple-300">Dhanush (Software Engineer)</strong></span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Supermarket POS Enterprise v2.0</span>
        </div>

      </div>
    </div>
  );
}
