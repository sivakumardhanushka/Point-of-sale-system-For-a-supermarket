import React, { useRef } from 'react';
import { Printer, X, Smartphone } from 'lucide-react';
import Barcode from './Barcode';


export default function ThermalReceipt({ sale, settings, onClose, onShareDigital }) {
  const receiptRef = useRef(null);

  if (!sale) return null;

  const handlePrint = () => {
    // Use Electron IPC to print via Windows printer driver when inside Electron.
    if (window?.electronAPI?.isElectron) {
      // Options can be customized; silent:false opens OS print dialog.
      window.electronAPI.printReceipt({ silent: false, printerName: '' });
    } else {
      // Fallback for browser environments.
      window.print();
    }
  };;

  const currency = settings?.currency || 'Rs.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700 text-slate-200">
          <div className="flex items-center space-x-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-sm">Receipt Preview ({settings?.printerWidth || '80mm'})</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Area Container */}
        <div className="p-4 flex justify-center bg-slate-950/60 overflow-y-auto max-h-[68vh]">
          <div 
            id="thermal-receipt-print-area"
            ref={receiptRef}
            className="bg-white text-black p-4 rounded shadow font-mono text-[11px] leading-tight w-[76mm] selection:bg-none border border-gray-300"
            style={{ color: '#000', backgroundColor: '#fff' }}
          >
            {/* Custom Header HTML (optional) */}
            {settings?.receiptHeaderHtml && (
              <div className="mb-2" dangerouslySetInnerHTML={{ __html: settings.receiptHeaderHtml }} />
            )}
            {/* Original Header */}
            <div className="text-center pb-2 border-b border-dashed border-gray-400">
              {settings?.showLogoOnReceipt !== false && settings?.logoUrl && (
                <div className="flex justify-center mb-1.5">
                  <img
                    src={settings.logoUrl}
                    alt="Store Logo"
                    className="max-h-12 max-w-[200px] object-contain"
                  />
                </div>
              )}
              <h2 className="text-sm font-black uppercase tracking-wider">{settings.storeName}</h2>
              <p className="text-[10px] font-semibold text-gray-700">{settings.branch}</p>
              <p className="text-[9px] text-gray-600">{settings.address}</p>
              <p className="text-[9px] text-gray-600">Tel: {settings.phone} / {settings.mobile}</p>
              {settings.taxNumber && (
                <p className="text-[9px] text-gray-600">Tax/VAT Reg: {settings.taxNumber}</p>
              )}
            </div>
            
            {/* ... existing Sale Meta etc. */}


            {/* Sale Meta */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(sale.timestamp || Date.now()).toLocaleDateString()} {new Date(sale.timestamp || Date.now()).toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName || 'Staff'}</span>
              </div>
              {sale.customerName && sale.customerName !== 'Walk-in Customer' && (
                <div className="flex justify-between font-semibold pt-0.5 border-t border-dotted border-gray-300">
                  <span>CUSTOMER:</span>
                  <span>{sale.customerName} ({sale.customerMobile || ''})</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-gray-400">
              <div className="flex justify-between font-bold border-b border-gray-300 pb-1 mb-1 text-[10px]">
                <span className="w-1/2">ITEM</span>
                <span className="w-1/6 text-center">QTY</span>
                <span className="w-1/6 text-right">PRICE</span>
                <span className="w-1/6 text-right">TOTAL</span>
              </div>

              <div className="space-y-1.5">
                {sale.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] leading-none">
                    <div className="w-1/2 font-medium truncate pr-1">
                      {item.name}
                      {item.discount > 0 && <span className="block text-[8px] text-gray-600">disc -{currency}{item.discount}</span>}
                    </div>
                    <div className="w-1/6 text-center font-bold">{item.qty}</div>
                    <div className="w-1/6 text-right font-mono">{Number(item.price).toFixed(2)}</div>
                    <div className="w-1/6 text-right font-bold font-mono">{Number(item.total || (item.price * item.qty)).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span>SUBTOTAL ({sale.items?.reduce((a, b) => a + Number(b.qty), 0)} items):</span>
                <span className="font-mono">{currency} {Number(sale.subtotal).toFixed(2)}</span>
              </div>

              {Number(sale.discount) > 0 && (
                <div className="flex justify-between text-gray-700 font-semibold">
                  <span>SPECIAL DISCOUNT:</span>
                  <span className="font-mono">-{currency} {Number(sale.discount).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.tax) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>TAX / VAT ({settings.taxRate}%):</span>
                  <span className="font-mono">{currency} {Number(sale.tax).toFixed(2)}</span>
                </div>
              )}

              {Number(sale.bagCharge) > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Shopping Bag Charge:</span>
                  <span className="font-mono">{currency} {Number(sale.bagCharge).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
                <span>NET TOTAL:</span>
                <span className="font-mono">{currency} {Number(sale.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment & Tender Info */}
            <div className="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>PAYMENT METHOD:</span>
                <span className="font-bold uppercase text-emerald-800">
                  {sale.paymentMethod === 'Credit' ? 'CREDIT / KHATA' : (sale.paymentMethod || 'Cash')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>PAID AMOUNT:</span>
                <span className="font-mono">{currency} {Number(sale.amountPaid || sale.total).toFixed(2)}</span>
              </div>
              {sale.paymentMethod !== 'Credit' && (
                <div className="flex justify-between font-bold text-xs pt-0.5">
                  <span>CHANGE GIVEN:</span>
                  <span className="font-mono">{currency} {Number(sale.changeDue || 0).toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Barcode & Footer Notice */}
            <div className="text-center pt-2 space-y-1">
              <div className="flex justify-center items-center py-1">
                <Barcode 
                  value={sale.invoiceNo} 
                  height={32} 
                  scale={1.3} 
                  showText={false} 
                  color="#000000" 
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-[9px] font-mono tracking-widest">{sale.invoiceNo}</p>
              
              <div className="text-[9px] text-gray-700 whitespace-pre-line pt-1 border-t border-dotted border-gray-300">
                {settings.receiptFooter}
                {settings?.receiptFooterHtml && settings.customerReceiptEnabled !== false && (
                  <div dangerouslySetInnerHTML={{ __html: settings.receiptFooterHtml }} />
                )}
              </div>
              <p className="text-[8px] text-gray-500 pt-1">Powered by Supermarket POS Desktop</p>
            </div>

          </div>
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="p-3 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between gap-2">
          <button
            onClick={onShareDigital}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Digital Mobile Bill</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
}
