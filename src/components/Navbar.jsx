import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  Receipt, 
  BarChart3, 
  Settings as SettingsIcon, 
  Wifi, 
  WifiOff, 
  Clock, 
  User, 
  HelpCircle,
  AlertTriangle,
  Smartphone,
  DollarSign,
  Lock,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Sun,
  Moon,
  Crown,
  Code2
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  onRequireAdmin,
  settings, 
  lowStockCount, 
  pendingBillsCount,
  onOpenShortcuts,
  theme = 'dark',
  onToggleTheme
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isDhanush = currentUser?.username === 'dhanush' || currentUser?.isCreator;
  const isAdminOrManager = isDhanush || currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // All available modules
  const allNavItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, shortcut: 'F1', roles: ['cashier', 'manager', 'admin'] },
    { id: 'inventory', label: 'Inventory & Alerts', icon: Package, shortcut: 'F2', badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-amber-500', roles: ['manager', 'admin'] },
    { id: 'purchasing', label: 'Purchases & Suppliers', icon: Truck, shortcut: 'F3', roles: ['manager', 'admin'] },
    { id: 'customers', label: 'Customers & Loyalty', icon: Users, shortcut: 'F4', roles: ['cashier', 'manager', 'admin'] },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, shortcut: 'F5', roles: ['admin'] },
    { id: 'reports', label: isAdminOrManager ? 'Reports & P&L' : 'Shift Z-Close', icon: BarChart3, shortcut: 'F6', roles: ['cashier', 'manager', 'admin'] },
    { id: 'digitalQueue', label: 'Digital Bills', icon: Smartphone, shortcut: 'F7', badge: pendingBillsCount > 0 ? pendingBillsCount : null, badgeColor: 'bg-emerald-500', roles: ['cashier', 'manager', 'admin'] },
    { id: 'settings', label: 'System Settings', icon: SettingsIcon, shortcut: 'F8', roles: ['admin'] }
  ];

  const handleTabClick = (item) => {
    if (isDhanush || item.roles.includes(currentUser.role)) {
      setActiveTab(item.id);
    } else {
      // Cashier clicked an admin-only feature -> request supervisor PIN
      onRequireAdmin(() => setActiveTab(item.id));
    }
  };

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-200 sticky top-0 z-30 select-none">
      {/* Top Banner with Store Brand, Terminal Info & Role Status */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 text-xs">
        
        {/* Left: Brand */}
        <div className="flex items-center space-x-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Store Logo" className="h-8 max-w-[140px] object-contain rounded" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-900/40">
              S
            </div>
          )}
          <div>
            <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span>{settings.storeName || 'ABC SUPERMARKET'}</span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {settings.branch || 'POS Terminal 01'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
              <span className="font-mono">{settings.address}</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400 font-semibold flex items-center gap-1">
                <Code2 className="w-3 h-3 text-purple-400 inline" />
                <span>By Dhanush (Software Engineer)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Status, Staff Role & Lock/Logout */}
        <div className="flex items-center space-x-3">
          
          {/* Offline / Online state indicator */}
          <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border ${
            isOnline 
              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' 
              : 'bg-amber-950/60 text-amber-300 border-amber-800/60 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Clock */}
          <div className="flex items-center space-x-1.5 text-slate-300 font-mono text-[11px] bg-slate-800/70 px-2.5 py-1 rounded-md border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>

          {/* Current Staff Role Badge */}
          {currentUser?.username === 'dhanush' || currentUser?.isCreator ? (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-xl border border-purple-500/70 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 shadow-md shadow-purple-950/50">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white ring-1 ring-amber-400/50 shadow">
                <Crown className="w-3.5 h-3.5 text-amber-200" />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-white text-xs leading-tight">Dhanush</span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-mono font-bold">
                    Software Engineer
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-wider font-mono text-purple-300 font-bold">
                  👑 System Creator • Master Admin
                </span>
              </div>
            </div>
          ) : (
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg border text-xs font-semibold ${
              isAdminOrManager 
                ? 'bg-purple-950/60 border-purple-800/60 text-purple-300' 
                : 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                isAdminOrManager ? 'bg-purple-600' : 'bg-emerald-600'
              }`}>
                {currentUser?.name?.[0] || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-white leading-tight">{currentUser?.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-mono opacity-80">
                  {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'manager' ? 'Store Manager' : 'Cashier Terminal'}
                </span>
              </div>
            </div>
          )}

          {/* Dedicated Dhanush / Admin Portal Gate */}
          <button
            onClick={() => onRequireAdmin()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/90 to-indigo-900/90 hover:from-purple-800 hover:to-indigo-800 border border-purple-600 text-purple-200 rounded-lg text-xs font-bold transition shadow-md shadow-purple-950/50 cursor-pointer"
            title="Dhanush (Software Engineer) Master Admin Access Portal"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin / Dev Portal</span>
          </button>

          {/* Dark / White Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer select-none ${
              theme === 'light'
                ? 'bg-amber-100 hover:bg-amber-200/90 border-amber-300 text-amber-900 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
            title={theme === 'light' ? 'Switch to Dark Mode (F9 / Click)' : 'Switch to White / Light Mode (Click)'}
          >
            {theme === 'light' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '12s' }} />
                <span>White</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </>
            )}
          </button>

          {/* Lock Register / Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Lock Register / Switch Cashier"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock (Logout)</span>
          </button>

          {/* Keyboard Shortcuts button */}
          <button
            onClick={onOpenShortcuts}
            title="Keyboard Shortcuts"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Module Tabs Bar */}
      <nav className="flex items-center px-3 space-x-1 overflow-x-auto py-1">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isAllowed = item.roles.includes(currentUser.role);

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer relative whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30'
                  : isAllowed
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-900/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isAllowed ? 'text-slate-400' : 'text-slate-600'}`} />
              <span>{item.label}</span>
              
              {!isAllowed && (
                <Lock className="w-3 h-3 text-slate-600 ml-0.5" />
              )}

              <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                isActive ? 'bg-black/20 text-white/90' : 'bg-slate-800 text-slate-500'
              }`}>
                {item.shortcut}
              </span>

              {item.badge && (
                <span className={`ml-1 text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor} animate-pulse`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
