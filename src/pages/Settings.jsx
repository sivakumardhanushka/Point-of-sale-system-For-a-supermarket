import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Printer, 
  Users, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  FileJson,
  Trash2,
  KeyRound,
  Image,
  MessageSquare,
  Sparkles,
  CreditCard,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Edit,
  UserPlus,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Check,
  Crown,
  Code2,
  Tag,
  Wifi,
  Bluetooth,
  Usb,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  HardDrive
} from 'lucide-react';
import { storage } from '../db/storage';
import { DEFAULT_STORE_LOGO_SVG } from '../assets/storeLogo';
import { printProductLabel } from '../utils/labelPrinter';

export default function Settings({ 
  settings, 
  onUpdateSettings, 
  users, 
  currentUser,
  onSaveUser,
  onUpdateUserPin,
  onDeleteUser,
  onReloadAll,
  theme = 'dark',
  onToggleTheme
}) {
  const [form, setForm] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [installedPrinters, setInstalledPrinters] = useState([]);
  const [testPrintLoading, setTestPrintLoading] = useState(false);
  const [testPrintMsg, setTestPrintMsg] = useState('');

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getPrinters) {
      window.electronAPI.getPrinters()
        .then(printers => {
          if (Array.isArray(printers)) {
            setInstalledPrinters(printers);
          }
        })
        .catch(err => console.warn('Could not query system printers:', err));
    }
  }, []);
  const [targetUserForPin, setTargetUserForPin] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // all, manager, cashier, admin
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [revealedPins, setRevealedPins] = useState({});
  const [staffNotice, setStaffNotice] = useState(null);

  const togglePinReveal = (userId) => {
    setRevealedPins(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image should be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({ ...prev, logoUrl: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateSettings(form);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleBackupExport = async () => {
    const jsonStr = storage.exportBackupJSON();
    const filename = `supermarket_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;

    if (window.electronAPI && window.electronAPI.saveBackupFile) {
      const res = await window.electronAPI.saveBackupFile({ data: jsonStr, filename });
      if (res.success) {
        setBackupMsg(`✓ Backup saved to: ${res.filePath}`);
      }
    } else {
      // Browser fallback download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBackupMsg(`✓ Backup downloaded as ${filename}`);
    }
    setTimeout(() => setBackupMsg(''), 5000);
  };

  const handleBackupImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      const res = storage.importBackupJSON(content);
      if (res.success) {
        alert('Database restored successfully! Reloading...');
        onReloadAll();
      } else {
        alert(`Restore failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('WARNING: Are you sure you want to reset the database to initial supermarket demo catalog? All new sales will be reset.')) {
      storage.resetToDefault();
      alert('Database restored to default demo state.');
      onReloadAll();
    }
  };

  const handleTestPrintLabel = async () => {
    setTestPrintLoading(true);
    setTestPrintMsg('');
    try {
      const sampleProduct = {
        name: 'Basmati Premium Rice 5Kg',
        barcode: '8901234567890',
        sellingPrice: 1250,
        unit: '5Kg Pack',
        expiryDate: '2027-12-31'
      };
      const res = await printProductLabel(sampleProduct, form);
      if (res && res.success !== false) {
        setTestPrintMsg(`✓ Test label printed! (Driver: ${form.labelPrinterDriver || 'Default Windows Driver'})`);
      } else {
        setTestPrintMsg(`Notice: Check printer or driver status (${res?.error || 'Sent'})`);
      }
    } catch (err) {
      setTestPrintMsg(`Error printing test label: ${err.message}`);
    } finally {
      setTestPrintLoading(false);
      setTimeout(() => setTestPrintMsg(''), 7000);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">System Settings & Local Database Maintenance</h3>
            <p className="text-[11px] text-slate-400">Configure supermarket branding, thermal printer format, and offline backups</p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/80 px-3 py-1 rounded-lg animate-pulse">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4 max-w-4xl">
        
        {/* Appearance & Color Theme */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>System Display Theme (Dark & White Mode)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Active: <strong className="uppercase text-emerald-400">{theme} Mode</strong>
            </span>
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs pt-1">
            {/* Dark Mode Card */}
            <div
              onClick={() => theme !== 'dark' && onToggleTheme?.()}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center space-x-3.5 select-none ${
                theme === 'dark'
                  ? 'bg-slate-950 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 opacity-75'
              }`}
            >
              <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-indigo-400 shrink-0">
                <Moon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">Dark Mode</span>
                  {theme === 'dark' && (
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                  Sleek, eye-friendly cockpit aesthetic. Ideal for fast supermarket POS counters.
                </p>
              </div>
            </div>

            {/* White / Light Mode Card */}
            <div
              onClick={() => theme !== 'light' && onToggleTheme?.()}
              className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center space-x-3.5 select-none ${
                theme === 'light'
                  ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-950/20 ring-1 ring-amber-500/50'
                  : 'bg-slate-800/60 border-slate-700 hover:border-slate-500 opacity-75'
              }`}
            >
              <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-amber-600 shrink-0">
                <Sun className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-sm text-white">White / Light Mode</span>
                  {theme === 'light' && (
                    <span className="bg-amber-500/20 text-amber-600 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">
                  Bright, high-contrast crisp white layout. Ideal for brightly lit retail supermarket environments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Supermarket Profile & Brand Logo */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>1. Supermarket Profile & Invoice Header Branding</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-mono font-bold">
              Invoice Logo Enabled
            </span>
          </h4>

          {/* Logo Branding Configuration Card */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-center gap-5">
            <div className="w-full md:w-64 flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-700/60 shadow-inner">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Receipt Logo Preview</span>
              {form.logoUrl ? (
                <img 
                  src={form.logoUrl} 
                  alt="Invoice Logo" 
                  className="max-h-16 max-w-full object-contain" 
                />
              ) : (
                <div className="text-slate-400 text-xs py-4 flex flex-col items-center">
                  <Image className="w-8 h-8 text-slate-300 mb-1" />
                  <span>No logo set</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2.5 text-xs">
              <div>
                <h5 className="font-bold text-white text-sm">Invoice & Thermal Receipt Logo</h5>
                <p className="text-slate-400 text-[11px]">
                  Upload your supermarket logo (PNG, JPG, or SVG). Printed automatically on 80mm/58mm thermal receipts & digital bills.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition cursor-pointer shadow">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Logo Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, logoUrl: DEFAULT_STORE_LOGO_SVG }))}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition cursor-pointer"
                >
                  Use Default Logo
                </button>

                {form.logoUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, logoUrl: '' }))}
                    className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-900/50 rounded-lg font-semibold transition cursor-pointer"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showLogoOnReceipt"
                    checked={form.showLogoOnReceipt !== false}
                    onChange={handleChange}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>Show logo on 80mm/58mm paper receipt</span>
                </label>

                <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    name="showLogoOnDigital"
                    checked={form.showLogoOnDigital !== false}
                    onChange={handleChange}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>Show logo on digital mobile bills</span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Supermarket Store Name</label>
              <input
                type="text"
                name="storeName"
                value={form.storeName}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Branch Name / Terminal</label>
              <input
                type="text"
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="text-slate-300 block mb-1 font-semibold">Store Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Telephone / Hotline</label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Tax / VAT Registration Number</label>
              <input
                type="text"
                name="taxNumber"
                value={form.taxNumber}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Currency & Pricing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">
            2. Currency, Taxes & Customer Loyalty Rates
          </h4>

          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Currency Symbol</label>
              <input
                type="text"
                name="currency"
                value={form.currency}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold"
                placeholder="Rs. or $"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">
                Sales Tax Rate (%) <span className="text-[10px] text-slate-400 font-normal">(0 = No Tax)</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                name="taxRate"
                value={form.taxRate}
                onChange={handleChange}
                placeholder="0"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Loyalty Cashback Rate (%)</label>
              <input
                type="number"
                step="any"
                name="loyaltyRate"
                value={form.loyaltyRate * 100}
                onChange={(e) => setForm(prev => ({ ...prev, loyaltyRate: Number(e.target.value) / 100 }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Credit Facility & Normal SMS Dispatch */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>3. Credit Customer Limits & Normal SMS Alert Configuration</span>
            </span>
            <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded font-mono font-bold">
              Cellular SMS Link
            </span>
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">SMS Sender Brand / Title</label>
              <input
                type="text"
                name="smsSender"
                value={form.smsSender || form.storeName}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
                placeholder="e.g. ABC Supermarket"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="smsEnabled"
                  checked={form.smsEnabled !== false}
                  onChange={handleChange}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span className="font-semibold">Prompt Normal SMS when credit balance increases</span>
              </label>
            </div>

            <div className="col-span-2">
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-300 font-semibold">Credit Increase SMS Message Template</label>
                <span className="text-[10px] text-slate-500">Variables: {`{customerName}, {amount}, {invoiceNo}, {creditBalance}, {creditLimit}, {availableCredit}, {currency}, {storeName}`}</span>
              </div>
              <textarea
                rows={3}
                name="smsTemplateCredit"
                value={form.smsTemplateCredit || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Thermal Printer Config */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>3. POS Thermal Receipt Printer Configuration</span>
          </h4>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Receipt Roll Paper Width</label>
              <select
                name="printerWidth"
                value={form.printerWidth}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="80mm">80mm (Standard POS Supermarket Printer)</option>
                <option value="58mm">58mm (Compact Portable Thermal Printer)</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  name="paperCut"
                  checked={form.paperCut}
                  onChange={handleChange}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>Auto-cut Paper Roll after printing</span>
              </label>
            </div>

            <div className="col-span-2">
              <label className="text-slate-300 block mb-1 font-semibold">Receipt Footer Thank-You Message</label>
              <textarea
                rows={2}
                name="receiptFooter"
                value={form.receiptFooter}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              {/* Custom HTML for receipt header */}
              <label className="text-slate-300 block mb-1 font-semibold mt-4">Custom Receipt Header HTML (Optional)</label>
              <textarea
                rows={4}
                name="receiptHeaderHtml"
                value={form.receiptHeaderHtml || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              {/* Custom HTML for receipt footer */}
              <label className="text-slate-300 block mb-1 font-semibold mt-4">Custom Receipt Footer HTML (Optional)</label>
              <textarea
                rows={4}
                name="receiptFooterHtml"
                value={form.receiptFooterHtml || ''}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              {/* Enable customer receipt printing */}
              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  name="customerReceiptEnabled"
                  checked={form.customerReceiptEnabled !== false}
                  onChange={handleChange}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>Enable Customer Receipt Printing</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── Section 4: Label Printer & Drivers Settings ──────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-violet-400" />
              <span>4. Barcode & Price Tag Label Printer (Drivers & Hardware)</span>
            </span>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[10px] text-slate-400 font-mono">
                {form.labelPrinterEnabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, labelPrinterEnabled: !prev.labelPrinterEnabled }))}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  form.labelPrinterEnabled ? 'bg-violet-500' : 'bg-slate-700'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                  form.labelPrinterEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`} />
              </button>
            </label>
          </h4>

          {!form.labelPrinterEnabled && (
            <div className="flex items-center gap-2.5 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
              <Tag className="w-4 h-4 text-slate-600 shrink-0" />
              <span>Enable the label printer above to configure barcode/price tag printing for your supermarket shelf labels and product stickers.</span>
            </div>
          )}

          {form.labelPrinterEnabled && (
            <div className="space-y-5">

              {/* 1. Printer Driver & Hardware Brand Presets */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-violet-400" />
                      <span>Windows Printer Driver</span>
                    </span>
                    {installedPrinters.length > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {installedPrinters.length} printer(s) detected
                      </span>
                    )}
                  </label>
                  {installedPrinters.length > 0 ? (
                    <select
                      name="labelPrinterDriver"
                      value={form.labelPrinterDriver || ''}
                      onChange={handleChange}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 font-mono text-xs"
                    >
                      <option value="">Default Windows Printer</option>
                      {installedPrinters.map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.name} {p.isDefault ? '(Default)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="labelPrinterDriver"
                      value={form.labelPrinterDriver || ''}
                      onChange={handleChange}
                      placeholder="e.g. Xprinter XP-365B or Zebra ZD220"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-violet-500"
                    />
                  )}
                  <p className="text-[10px] text-slate-500 mt-1">Select your installed label printer driver from Windows Devices &amp; Printers.</p>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Printer Brand &amp; Protocol Preset</label>
                  <select
                    name="labelPrinterDriverPreset"
                    value={form.labelPrinterDriverPreset || 'Generic'}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500 text-xs"
                  >
                    <option value="Generic">Generic (Windows Driver / Spooler - Recommended)</option>
                    <option value="Xprinter">Xprinter (XP-365B / XP-235B / XP-370B / XP-420B)</option>
                    <option value="Zebra">Zebra (ZD220 / ZD230 / GK420d / ZT230 - ZPL)</option>
                    <option value="TSC">TSC (TE200 / TE244 / TTP-244 Pro / DA200 - TSPL)</option>
                    <option value="Gprinter">Gprinter / Rongta / Posiflex / Dymo</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">Configures standard command language and vector barcode rendering.</p>
                </div>
              </div>

              {/* 2. Connection Type Row */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Printer Connection Interface</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'WindowsDriver', label: 'Windows Driver', desc: 'Direct Windows Spooler', icon: HardDrive, color: 'purple' },
                    { id: 'USB', label: 'USB Cable', desc: 'Direct USB port', icon: Usb, color: 'blue' },
                    { id: 'Network', label: 'Network / LAN', desc: 'IP address via TCP', icon: Wifi, color: 'emerald' },
                    { id: 'Bluetooth', label: 'Bluetooth', desc: 'Wireless pairing', icon: Bluetooth, color: 'indigo' },
                  ].map(({ id, label, desc, icon: Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, labelPrinterConnection: id }))}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 text-xs font-semibold transition cursor-pointer ${
                        (form.labelPrinterConnection || 'USB') === id
                          ? `bg-${color}-950/60 border-${color}-500 text-${color}-300 shadow-md shadow-${color}-950/40`
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${
                        (form.labelPrinterConnection || 'USB') === id ? `text-${color}-400` : 'text-slate-500'
                      }`} />
                      <span>{label}</span>
                      <span className="text-[9px] font-normal text-slate-500">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contextual Connection Fields */}
              {form.labelPrinterConnection === 'Network' && (
                <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Printer IP Address</label>
                    <input
                      type="text"
                      name="labelPrinterIp"
                      value={form.labelPrinterIp || ''}
                      onChange={handleChange}
                      placeholder="e.g. 192.168.1.210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">TCP Port</label>
                    <input
                      type="number"
                      name="labelPrinterPort"
                      value={form.labelPrinterPort || '9100'}
                      onChange={handleChange}
                      placeholder="9100"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5">Default: 9100 (RAW / JetDirect port)</p>
                  </div>
                </div>
              )}

              {form.labelPrinterConnection === 'Bluetooth' && (
                <div className="text-xs p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-xl">
                  <label className="text-slate-300 block mb-1 font-semibold">Bluetooth Device Name or MAC Address</label>
                  <input
                    type="text"
                    name="labelPrinterBtDevice"
                    value={form.labelPrinterBtDevice || ''}
                    onChange={handleChange}
                    placeholder="e.g. Label_Printer_BT or 00:11:22:33:44:55"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Pair the printer in Windows Bluetooth settings first, then enter the device name.</p>
                </div>
              )}

              {/* Quick Label Size Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Quick Standard Label Size Presets</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { label: '50 × 30 mm', w: '50', h: '30', note: 'Standard Shelf Tag' },
                    { label: '40 × 30 mm', w: '40', h: '30', note: 'Compact Barcode' },
                    { label: '38 × 25 mm', w: '38', h: '25', note: 'Small Grocery Sticker' },
                    { label: '58 × 40 mm', w: '58', h: '40', note: 'Retail Shelf Tag' },
                    { label: '80 × 50 mm', w: '80', h: '50', note: 'Large Product Box' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, labelWidth: preset.w, labelHeight: preset.h }))}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        form.labelWidth === preset.w && form.labelHeight === preset.h
                          ? 'bg-violet-600/30 border-violet-500 text-violet-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="font-bold">{preset.label}</span>
                      <span className="text-[10px] text-slate-400 ml-1">({preset.note})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Label Dimensions & Print Settings */}
              <div className="grid grid-cols-3 gap-x-4 gap-y-3 text-xs">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Label Width (mm)</label>
                  <input
                    type="number"
                    name="labelWidth"
                    value={form.labelWidth || '50'}
                    onChange={handleChange}
                    min="20"
                    max="110"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Label Height (mm)</label>
                  <input
                    type="number"
                    name="labelHeight"
                    value={form.labelHeight || '30'}
                    onChange={handleChange}
                    min="10"
                    max="150"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Gap / Sensor Type</label>
                  <select
                    name="labelGapType"
                    value={form.labelGapType || 'gap'}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="gap">Gap (Standard label rolls with spacing)</option>
                    <option value="blackmark">Black Mark (Reflective sensor)</option>
                    <option value="continuous">Continuous (No gap / Cut manually)</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Print Darkness (1 – 15)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      name="labelDarkness"
                      min="1"
                      max="15"
                      step="1"
                      value={form.labelDarkness || '8'}
                      onChange={handleChange}
                      className="flex-1 accent-violet-500"
                    />
                    <span className="font-mono font-bold text-violet-300 w-6 text-center">{form.labelDarkness || '8'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Higher = darker barcode. Default: 8</p>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Print Speed (2–6 ips)</label>
                  <input
                    type="number"
                    name="labelPrintSpeed"
                    value={form.labelPrintSpeed || '3'}
                    onChange={handleChange}
                    min="2"
                    max="6"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">Inches per second (Default: 3)</p>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Default Copies per Job</label>
                  <input
                    type="number"
                    name="labelCopies"
                    value={form.labelCopies || '1'}
                    onChange={handleChange}
                    min="1"
                    max="99"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              {/* Label Content Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Label Printed Content Elements</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { key: 'labelShowStoreName', label: 'Store Name (Header)' },
                    { key: 'labelShowProductName', label: 'Product Name' },
                    { key: 'labelShowBarcode', label: 'Code128 Barcode & Number' },
                    { key: 'labelShowPrice', label: 'Selling Price (Bold)' },
                    { key: 'labelShowExpiry', label: 'Expiry Date (if set)' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 text-slate-300 cursor-pointer p-2 bg-slate-800/50 rounded-lg border border-slate-700/60 hover:border-slate-600">
                      <input
                        type="checkbox"
                        name={key}
                        checked={form[key] !== false}
                        onChange={handleChange}
                        className="w-4 h-4 accent-violet-500 rounded"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Auto-Print Toggle */}
              <label className="flex items-center justify-between p-3 bg-violet-950/20 border border-violet-800/40 rounded-xl cursor-pointer hover:border-violet-700/60 transition">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Auto-Print Label on New Product Save</span>
                  <span className="text-[10px] text-slate-500">When enabled, a barcode sticker prints automatically each time you create a new product in Inventory.</span>
                </div>
                <input
                  type="checkbox"
                  name="labelAutoPrintOnNewProduct"
                  checked={form.labelAutoPrintOnNewProduct === true}
                  onChange={handleChange}
                  className="w-4 h-4 accent-violet-500 rounded ml-4 shrink-0"
                />
              </label>

              {/* Live Label Preview & Test Print Button */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
                    <span>Live Sticker Layout Preview ({form.labelWidth || 50}mm × {form.labelHeight || 30}mm)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleTestPrintLabel}
                    disabled={testPrintLoading}
                    className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{testPrintLoading ? 'Sending to Driver…' : 'Print Test Label'}</span>
                  </button>
                </div>

                {testPrintMsg && (
                  <div className="p-2 bg-violet-950/70 border border-violet-800 text-violet-200 text-xs rounded-lg animate-in fade-in">
                    {testPrintMsg}
                  </div>
                )}

                <div className="flex justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div
                    className="bg-white text-black font-mono text-[8px] leading-tight shadow-xl rounded flex flex-col items-center justify-between overflow-hidden"
                    style={{
                      width: `${Math.min(Number(form.labelWidth || 50) * 2.4, 260)}px`,
                      height: `${Math.min(Number(form.labelHeight || 30) * 2.4, 160)}px`,
                      padding: '4px 6px',
                    }}
                  >
                    {form.labelShowStoreName !== false && (
                      <p className="text-[7px] font-semibold text-gray-700 tracking-wider uppercase truncate w-full text-center">
                        {form.storeName || 'ABC SUPERMARKET'}
                      </p>
                    )}
                    {form.labelShowProductName !== false && (
                      <p className="font-bold text-center truncate w-full text-[9px] leading-tight">
                        Basmati Premium Rice 5Kg
                      </p>
                    )}
                    {form.labelShowBarcode !== false && (
                      <div className="flex flex-col items-center w-full px-2 my-0.5">
                        <div className="flex gap-px w-full justify-center">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div
                              key={i}
                              className="bg-black"
                              style={{ width: i % 3 === 0 ? '2px' : '1px', height: '18px' }}
                            />
                          ))}
                        </div>
                        <span style={{ fontSize: '7px' }} className="font-mono font-bold tracking-widest mt-0.5">
                          8901234567890
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-end w-full px-1">
                      <div className="text-[7px] text-gray-600 text-left leading-tight">
                        <span>5Kg Pack</span>
                        {form.labelShowExpiry && <span className="block text-gray-500">Exp: 2027-12-31</span>}
                      </div>
                      {form.labelShowPrice !== false && (
                        <p className="font-black text-[11px] leading-none text-right">
                          {form.currency || 'Rs.'} 1,250.00
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center">
                  Preview rendered at ~2.4× scale — Actual output will print to: <strong className="text-violet-300">{form.labelPrinterDriver || 'Default Windows Printer Driver'}</strong>
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Save Settings Button */}
        <div className="text-right">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950 flex items-center space-x-2 ml-auto cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>

      {/* Section 4: Local Database Backup & Restore */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-w-4xl">
        <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>4. 100% Offline Local Database Backup & Restore</span>
        </h4>

        <p className="text-xs text-slate-400">
          Your entire supermarket database (products, sales tickets, customer profiles, supplier ledgers, expenses) is stored securely on this computer.
        </p>

        {backupMsg && (
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/80 rounded-lg text-emerald-300 text-xs font-medium">
            {backupMsg}
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2 text-xs">
          {/* Backup Button */}
          <button
            type="button"
            onClick={handleBackupExport}
            className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Local Database Backup (JSON)</span>
          </button>

          {/* Restore File Input */}
          <label className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 font-bold transition cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Restore From Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleBackupImport}
              className="hidden"
            />
          </label>

          {/* Reset button */}
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center space-x-2 px-4 py-2.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-900/60 rounded-xl text-rose-300 font-bold transition ml-auto"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      {/* Section 5: Staff & Role Security (Admin Authority) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>5. Staff & Role-Based Access Control (Admin Authority)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin can add multiple managers & cashiers, edit staff roles, toggle active status, and change/reset any password or PIN.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Change Admin's Own Password / PIN */}
            {currentUser && (
              <button
                type="button"
                onClick={() => setTargetUserForPin(currentUser)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-purple-950/70 hover:bg-purple-900/80 border border-purple-800 text-purple-200 rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                title="Change your own Administrator password or PIN"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-300" />
                <span>Change My Admin Password</span>
              </button>
            )}

            {/* Add New Manager / Cashier */}
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Manager / Cashier</span>
            </button>
          </div>
        </div>

        {/* Dhanush Software Engineering Ownership & Master Clearance Banner */}
        <div className="p-4 bg-gradient-to-r from-purple-950/80 via-slate-950 to-indigo-950/80 border border-purple-600/70 rounded-xl flex items-center justify-between gap-4 flex-wrap shadow-lg shadow-purple-950/40">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/60 ring-2 ring-amber-400/50">
              <Crown className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h5 className="font-bold text-white text-sm">System Architect & Creator: Dhanush (Software Engineer)</h5>
                <span className="text-[10px] bg-amber-950/80 border border-amber-600 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  MASTER ROOT CLEARANCE
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Exclusive Administrator security door enabled. High-privilege features and terminal management are isolated from regular cashier accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-300 bg-purple-950/80 px-3 py-1.5 rounded-lg border border-purple-700/80">
            <Code2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Developer Door: Active (PIN: 9999)</span>
          </div>
        </div>

        {/* Notice Banner */}
        {staffNotice && (
          <div className="flex items-center justify-between p-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-200 rounded-lg text-xs animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{staffNotice}</span>
            </div>
            <button 
              type="button" 
              onClick={() => setStaffNotice(null)}
              className="text-emerald-400 hover:text-white px-1.5 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            {[
              { id: 'all', label: 'All Staff', count: users.length },
              { id: 'manager', label: 'Managers', count: users.filter(u => u.role === 'manager').length },
              { id: 'cashier', label: 'Cashiers', count: users.filter(u => u.role === 'cashier').length },
              { id: 'admin', label: 'Admins', count: users.filter(u => u.role === 'admin').length }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setUserRoleFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                  userRoleFilter === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label} <span className="text-[10px] opacity-75 font-mono">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff by name or @username..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {userSearchQuery && (
              <button
                type="button"
                onClick={() => setUserSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Staff Grid Cards */}
        {(() => {
          const filteredUsers = (users || []).filter(u => {
            const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
            const matchesSearch = !userSearchQuery || 
              (u.name && u.name.toLowerCase().includes(userSearchQuery.toLowerCase())) ||
              (u.username && u.username.toLowerCase().includes(userSearchQuery.toLowerCase()));
            return matchesRole && matchesSearch;
          });

          if (filteredUsers.length === 0) {
            return (
              <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800/80 text-slate-400 text-xs">
                No staff members found matching "{userSearchQuery || userRoleFilter}".
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {filteredUsers.map(u => {
                const isAdmin = u.role === 'admin';
                const isManager = u.role === 'manager';
                const isDhanush = u.username === 'dhanush' || u.isCreator;
                const isCurrentSession = currentUser?.id === u.id;
                const isActive = u.active !== false;
                const isPinRevealed = !!revealedPins[u.id];

                return (
                  <div 
                    key={u.id} 
                    className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 transition ${
                      isDhanush
                        ? 'bg-gradient-to-br from-purple-950/90 via-slate-950 to-indigo-950/90 border-purple-500 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/50'
                        : isActive
                        ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/60 border-rose-950/60 opacity-80'
                    }`}
                  >
                    {/* Top Row: Name, Username, Role badge & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isDhanush
                            ? 'bg-gradient-to-tr from-purple-600 to-amber-500 text-white ring-2 ring-amber-400/50 shadow-md shadow-purple-900/60'
                            : isAdmin 
                            ? 'bg-purple-900/60 border border-purple-700 text-purple-200' 
                            : isManager 
                            ? 'bg-blue-900/60 border border-blue-700 text-blue-200' 
                            : 'bg-emerald-900/60 border border-emerald-700 text-emerald-200'
                        }`}>
                          {isDhanush ? <Crown className="w-5 h-5 text-amber-200" /> : (u.name?.[0] || 'U')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm">{u.name}</span>
                            {isDhanush && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full font-bold">
                                Creator / Engineer
                              </span>
                            )}
                            {isCurrentSession && (
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                                You (Active)
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono">@{u.username}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isDhanush
                            ? 'bg-gradient-to-r from-purple-900 to-amber-900 border border-amber-600 text-amber-200'
                            : isAdmin 
                            ? 'bg-purple-950 text-purple-300 border border-purple-800' 
                            : isManager 
                            ? 'bg-blue-950 text-blue-300 border border-blue-800' 
                            : 'bg-slate-800 text-emerald-400 border border-slate-700'
                        }`}>
                          {isDhanush ? '👑 CREATOR ROOT' : u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Manager' : 'Cashier'}
                        </span>
                        
                        <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                          isActive ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                          {isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Security PIN / Password view */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800/80">
                      <div className="flex items-center space-x-2">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] text-slate-400">PIN / Password:</span>
                        <span className="font-mono font-bold tracking-wider text-emerald-400 text-xs">
                          {isPinRevealed ? u.pin : '••••'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePinReveal(u.id)}
                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
                        title={isPinRevealed ? 'Hide PIN' : 'Reveal PIN to Admin'}
                      >
                        {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center space-x-1.5">
                        {/* Change PIN button */}
                        <button
                          type="button"
                          onClick={() => setTargetUserForPin(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1"
                          title="Change or reset password/PIN"
                        >
                          <KeyRound className="w-3 h-3 text-purple-400" />
                          <span>Change PIN</span>
                        </button>

                        {/* Edit Profile button */}
                        <button
                          type="button"
                          onClick={() => setEditingUser(u)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded text-[11px] font-semibold transition cursor-pointer flex items-center space-x-1"
                          title="Edit staff name, username, or role"
                        >
                          <Edit className="w-3 h-3 text-blue-400" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-1">
                        {isDhanush ? (
                          <span className="text-[10px] text-amber-300/80 font-mono bg-purple-950/60 border border-purple-800 px-2 py-1 rounded">
                            👑 Protected Creator
                          </span>
                        ) : (
                          <>
                            {/* Toggle Active / Inactive Status */}
                            {!isCurrentSession && (
                              <button
                                type="button"
                                onClick={() => {
                                  const willBeActive = !isActive;
                                  if (isAdmin && !willBeActive) {
                                    const activeAdmins = users.filter(usr => usr.role === 'admin' && usr.active !== false);
                                    if (activeAdmins.length <= 1) {
                                      alert('Cannot disable the last active Administrator account.');
                                      return;
                                    }
                                  }
                                  onSaveUser({ ...u, active: willBeActive });
                                  setStaffNotice(`${u.name} is now ${willBeActive ? 'Active' : 'Disabled'}.`);
                                }}
                                className={`p-1.5 rounded text-[10px] font-semibold transition border cursor-pointer ${
                                  isActive 
                                    ? 'border-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-800' 
                                    : 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60'
                                }`}
                                title={isActive ? 'Deactivate Account' : 'Re-activate Account'}
                              >
                                {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {/* Delete User */}
                            {!isCurrentSession && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAdmin) {
                                    const adminCount = users.filter(usr => usr.role === 'admin').length;
                                    if (adminCount <= 1) {
                                      alert('Cannot delete the last Administrator account.');
                                      return;
                                    }
                                  }
                                  if (window.confirm(`Permanently delete staff account "${u.name}" (@${u.username})?`)) {
                                    onDeleteUser(u.id);
                                    setStaffNotice(`Staff account "${u.name}" deleted successfully.`);
                                  }
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Add New Staff Modal (Supports Adding Multiple Managers & Cashiers in One Go) */}
      {isAddUserModalOpen && (
        <AddStaffModal
          existingUsers={users}
          onClose={() => setIsAddUserModalOpen(false)}
          onSave={(data) => {
            onSaveUser(data);
          }}
          onNotice={(msg) => setStaffNotice(msg)}
        />
      )}

      {/* Edit Staff Profile Modal */}
      {editingUser && (
        <EditStaffModal
          user={editingUser}
          existingUsers={users}
          onClose={() => setEditingUser(null)}
          onSave={(updatedData) => {
            onSaveUser(updatedData);
            setEditingUser(null);
            setStaffNotice(`Profile for "${updatedData.name}" updated successfully.`);
          }}
        />
      )}

      {/* Admin Change Password / PIN Modal (For Admin Themselves OR Any Staff) */}
      {targetUserForPin && (
        <ChangePinModal
          user={targetUserForPin}
          isCurrentUser={currentUser?.id === targetUserForPin.id}
          onClose={() => setTargetUserForPin(null)}
          onSave={(newPin) => {
            onUpdateUserPin(targetUserForPin.id, newPin);
            setTargetUserForPin(null);
            setStaffNotice(`Password / PIN for "${targetUserForPin.name}" successfully updated.`);
          }}
        />
      )}

    </div>
  );
}

// Modal: Add Managers & Cashiers sequentially without losing context
function AddStaffModal({ existingUsers, onClose, onSave, onNotice }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'cashier',
    pin: '',
    active: true
  });
  const [showPin, setShowPin] = useState(true);
  const [sessionAddedCount, setSessionAddedCount] = useState(0);
  const [addedNames, setAddedNames] = useState([]);

  const generatePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormData(prev => ({ ...prev, pin: randomPin }));
    setShowPin(true);
  };

  const handleValidateAndSave = (addAnother = false) => {
    if (!formData.name.trim()) {
      alert('Please enter the staff member\'s Full Name.');
      return;
    }
    const cleanUsername = formData.username.toLowerCase().trim();
    if (!cleanUsername) {
      alert('Please enter a unique Username.');
      return;
    }
    // Check username uniqueness
    const exists = existingUsers.some(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      alert(`Username "@${cleanUsername}" is already in use by another staff member. Please use a unique username.`);
      return;
    }
    if (!formData.pin || formData.pin.length < 4) {
      alert('Security PIN must be at least 4 digits.');
      return;
    }

    const newStaff = {
      name: formData.name.trim(),
      username: cleanUsername,
      role: formData.role,
      pin: String(formData.pin),
      active: formData.active !== false
    };

    onSave(newStaff);
    const count = sessionAddedCount + 1;
    setSessionAddedCount(count);
    setAddedNames(prev => [...prev, { name: newStaff.name, role: newStaff.role }]);
    
    if (onNotice) {
      onNotice(`Successfully added ${newStaff.role} "${newStaff.name}" (@${newStaff.username})!`);
    }

    if (addAnother) {
      // Clear inputs for the next cashier or manager
      setFormData({
        name: '',
        username: '',
        role: formData.role, // retain role preference
        pin: '',
        active: true
      });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>Add Supermarket Staff (Manager / Cashier)</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Add multiple team members in one session using "Save & Add Another".
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Batch Session Status Counter */}
        {sessionAddedCount > 0 && (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-300">
            <div className="flex items-center space-x-1.5 font-bold">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{sessionAddedCount} staff member{sessionAddedCount > 1 ? 's' : ''} added this session!</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {addedNames.map((s, idx) => (
                <span key={idx} className="bg-emerald-900/60 border border-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded text-[10px]">
                  {s.name} ({s.role})
                </span>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleValidateAndSave(false); }} className="space-y-3.5">
          {/* Role Selector Tabs */}
          <div>
            <label className="text-slate-300 block mb-1.5 font-semibold">Assign Staff Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { 
                  id: 'cashier', 
                  title: 'Cashier', 
                  sub: 'POS Billing & Receipts', 
                  color: 'border-emerald-600 bg-emerald-950/40 text-emerald-300' 
                },
                { 
                  id: 'manager', 
                  title: 'Store Manager', 
                  sub: 'Stock, Purchases & CRM', 
                  color: 'border-blue-600 bg-blue-950/40 text-blue-300' 
                },
                { 
                  id: 'admin', 
                  title: 'Administrator', 
                  sub: 'Full System Control', 
                  color: 'border-purple-600 bg-purple-950/40 text-purple-300' 
                }
              ].map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: r.id })}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    formData.role === r.id
                      ? `${r.color} ring-1 ring-emerald-500 font-bold`
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-white">{r.title}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 leading-tight">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Full Staff Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kasun Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Login Username (Unique) *</label>
            <input
              type="text"
              required
              placeholder="e.g. cashier3 or manager_kasun"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* PIN / Password with generator and toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">Security PIN / Password (4 to 6 Digits) *</label>
              <button
                type="button"
                onClick={generatePin}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center space-x-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate PIN</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                required
                maxLength={6}
                placeholder="e.g. 4521"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Staff will use this PIN to log in and unlock POS terminal registers.</p>
          </div>

          {/* Account Status */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="activeStatus"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="activeStatus" className="text-slate-300 cursor-pointer font-medium">
              Active account (immediately eligible for login and register access)
            </label>
          </div>

          {/* Modal Action Buttons: Multi-add vs Save & Close */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center space-x-2">
              <button 
                type="button"
                onClick={() => handleValidateAndSave(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 hover:text-white font-bold rounded-lg shadow transition cursor-pointer flex items-center space-x-1"
                title="Save current staff member and immediately add another manager or cashier"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Save & Add Another</span>
              </button>

              <button 
                type="submit" 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Done</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal: Edit Staff Member Profile (Name, Username, Role, Status)
function EditStaffModal({ user, existingUsers, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    role: user.role || 'cashier',
    active: user.active !== false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Full Name is required.');
      return;
    }
    const cleanUsername = formData.username.toLowerCase().trim();
    if (!cleanUsername) {
      alert('Username is required.');
      return;
    }
    // Check if new username clashes with another existing user
    const exists = existingUsers.some(u => u.id !== user.id && u.username.toLowerCase() === cleanUsername);
    if (exists) {
      alert(`Username "@${cleanUsername}" is already taken by another account.`);
      return;
    }

    onSave({
      ...user,
      name: formData.name.trim(),
      username: cleanUsername,
      role: formData.role,
      active: formData.active
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
          <div>
            <h3 className="font-bold text-sm text-white">Edit Staff Profile</h3>
            <p className="text-[11px] text-slate-400">Updating @{user.username}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Username *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Staff Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold"
            >
              <option value="cashier">Cashier (POS Checkout & Receipts)</option>
              <option value="manager">Store Manager (Inventory, Purchasing & Reports)</option>
              <option value="admin">Administrator (Full Master System Control)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="editActiveStatus"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="editActiveStatus" className="text-slate-300 cursor-pointer font-medium">
              Active account (enabled for terminal login)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal: Admin Change/Reset Password & PIN (For Admin Themselves OR Cashiers & Managers)
function ChangePinModal({ user, isCurrentUser, onClose, onSave }) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(true);

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setNewPin(randomPin);
    setConfirmPin(randomPin);
    setShowPin(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      alert('Security PIN must be at least 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      alert('PIN confirmation does not match. Please re-enter identical values.');
      return;
    }
    onSave(newPin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-start border-b border-slate-800 pb-2.5">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-400" />
              <span>{isCurrentUser ? 'Change My Admin Password / PIN' : 'Change Staff Password / PIN'}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Target Staff: <span className="text-white font-bold">{user.name}</span> (@{user.username}) • Role: <span className="uppercase text-purple-300">{user.role}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Quick PIN Generator Button */}
        <div className="flex items-center justify-between p-2.5 bg-slate-950/70 rounded-xl border border-slate-800">
          <span className="text-[11px] text-slate-400">Need a quick secure PIN?</span>
          <button
            type="button"
            onClick={handleGenerateRandomPin}
            className="flex items-center space-x-1 px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800 text-purple-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Generate 4-Digit PIN</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold">New PIN / Password (4-6 digits) *</label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                {showPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPin ? 'Hide' : 'Show'}</span>
              </button>
            </div>

            <input
              type={showPin ? 'text' : 'password'}
              required
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Confirm New PIN / Password *</label>
            <input
              type={showPin ? 'text' : 'password'}
              required
              maxLength={6}
              placeholder="••••"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center tracking-widest text-lg focus:outline-none focus:border-purple-500"
            />
          </div>

          {newPin && confirmPin && newPin !== confirmPin && (
            <p className="text-[11px] text-rose-400 font-semibold">
              PINs do not match. Please re-enter identically.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-semibold">
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded shadow transition cursor-pointer"
            >
              Update Password / PIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


