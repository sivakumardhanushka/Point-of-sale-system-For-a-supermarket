import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Printer, 
  Download, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  ShoppingBag,
  Clock,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function Reports({ sales, products, expenses, settings, onSelectSaleForPrint }) {
  const [reportTab, setReportTab] = useState('summary'); // summary, invoices, zReport, pnl
  const [selectedCashier, setSelectedCashier] = useState('all');

  const currency = settings.currency || 'Rs.';

  // Summary Metrics
  const totalSalesRevenue = sales.reduce((sum, s) => sum + (s.status !== 'Refunded' ? Number(s.total || 0) : 0), 0);
  
  // COGS calculation
  const totalCOGS = sales.reduce((sum, s) => {
    if (s.status === 'Refunded') return sum;
    const itemsCost = s.items?.reduce((iSum, item) => iSum + ((Number(item.costPrice) || 0) * Number(item.qty)), 0) || 0;
    return sum + itemsCost;
  }, 0);

  const grossProfit = totalSalesRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const totalItemsSold = sales.reduce((sum, s) => {
    if (s.status === 'Refunded') return sum;
    return sum + (s.items?.reduce((iSum, i) => iSum + Number(i.qty), 0) || 0);
  }, 0);

  // Cashier Shift Breakdown for Z-Report
  const cashSales = sales.filter(s => s.paymentMethod === 'Cash' && s.status !== 'Refunded')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const cardSales = sales.filter(s => s.paymentMethod === 'Card' && s.status !== 'Refunded')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const qrSales = sales.filter(s => (s.paymentMethod === 'QR / UPI' || s.paymentMethod === 'QR') && s.status !== 'Refunded')
    .reduce((sum, s) => sum + Number(s.total), 0);
  const refundedSales = sales.filter(s => s.status === 'Refunded')
    .reduce((sum, s) => sum + Number(s.total), 0);

  // Top Selling Products
  const productSalesCount = {};
  sales.forEach(s => {
    if (s.status !== 'Refunded') {
      s.items?.forEach(item => {
        productSalesCount[item.name] = (productSalesCount[item.name] || 0) + Number(item.qty);
      });
    }
  });

  const topProducts = Object.entries(productSalesCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleExportSalesCSV = () => {
    const headers = 'InvoiceNo,Timestamp,Cashier,Customer,Subtotal,Discount,Tax,Total,PaymentMethod,Status\n';
    const rows = sales.map(s => 
      `"${s.invoiceNo}","${s.timestamp}","${s.cashierName || ''}","${s.customerName || ''}","${s.subtotal}","${s.discount}","${s.tax}","${s.total}","${s.paymentMethod}","${s.status}"`
    ).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sales_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 space-y-4">
      
      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-lg">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Supermarket Reports & Analytics Dashboard</h3>
            <p className="text-[11px] text-slate-400">Real-time revenue, profit & loss, cashier shift Z-reports</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1 text-xs">
            {[
              { id: 'summary', label: 'Executive Dashboard' },
              { id: 'invoices', label: 'Sales Invoices' },
              { id: 'zReport', label: 'Shift Z-Report' },
              { id: 'pnl', label: 'Profit & Loss (P&L)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setReportTab(tab.id)}
                className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                  reportTab === tab.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportSalesCSV}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EXECUTIVE SUMMARY */}
      {reportTab === 'summary' && (
        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Total Gross Sales</span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {currency} {totalSalesRevenue.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-400 font-medium">From {sales.length} customer tickets</span>
              </div>
              <div className="p-3 bg-emerald-950/60 rounded-xl text-emerald-400 border border-emerald-800/40">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Estimated Gross Profit</span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  {currency} {grossProfit.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {totalSalesRevenue > 0 ? `${((grossProfit / totalSalesRevenue) * 100).toFixed(1)}% margin` : '0%'}
                </span>
              </div>
              <div className="p-3 bg-teal-950/60 rounded-xl text-teal-400 border border-teal-800/40">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Products Sold</span>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {totalItemsSold} Items
                </div>
                <span className="text-[11px] text-slate-400">Total units scanned</span>
              </div>
              <div className="p-3 bg-blue-950/60 rounded-xl text-blue-400 border border-blue-800/40">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Net Operating Profit</span>
                <div className={`text-2xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency} {netProfit.toLocaleString()}
                </div>
                <span className="text-[11px] text-slate-400">After operational expenses</span>
              </div>
              <div className="p-3 bg-purple-950/60 rounded-xl text-purple-400 border border-purple-800/40">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Middle Layout: Payment Breakdown & Top Selling Products */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Payment Method Breakdown */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Sales by Payment Method</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-300">Cash Collections</span>
                  <span className="font-mono font-bold text-emerald-400">{currency} {cashSales.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-300">Credit / Debit Card Terminal</span>
                  <span className="font-mono font-bold text-blue-400">{currency} {cardSales.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-slate-300">QR / UPI / Bank Payments</span>
                  <span className="font-mono font-bold text-amber-400">{currency} {qrSales.toFixed(2)}</span>
                </div>
                {refundedSales > 0 && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-rose-900/50 text-rose-300">
                    <span>Refunds Paid Out</span>
                    <span className="font-mono font-bold">-{currency} {refundedSales.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top 5 Best Sellers */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Top Selling Products</span>
              </h4>

              <div className="space-y-2 text-xs">
                {topProducts.length === 0 ? (
                  <p className="text-slate-500 text-center py-6">No sales recorded yet.</p>
                ) : (
                  topProducts.map(([name, count], index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-center space-x-2 truncate">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-slate-200 truncate">{name}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 shrink-0">
                        {count} sold
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: SALES INVOICES TABLE */}
      {reportTab === 'invoices' && (
        <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3">Date & Time</th>
                  <th className="p-3">Cashier</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-right">Discount</th>
                  <th className="p-3 text-right">Net Total</th>
                  <th className="p-3 text-center">Payment</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-white">
                      {s.invoiceNo}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {new Date(s.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 text-slate-300">
                      {s.cashierName || 'Cashier'}
                    </td>
                    <td className="p-3 text-slate-300">
                      {s.customerName || 'Walk-in'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      {currency} {Number(s.subtotal).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-400">
                      -{currency} {Number(s.discount || 0).toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {currency} {Number(s.total).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'Refunded' 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectSaleForPrint(s)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                        title="View / Reprint Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: SHIFT Z-REPORT */}
      {reportTab === 'zReport' && (
        <div className="flex-1 flex justify-center overflow-y-auto p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs font-mono text-slate-200">
            <div className="text-center pb-3 border-b border-dashed border-slate-700">
              <h3 className="text-base font-bold text-white uppercase">{settings.storeName}</h3>
              <p className="text-[11px] text-slate-400">END OF DAY / CASHIER Z-REPORT</p>
              <p className="text-[10px] text-slate-500 mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>

            <div className="space-y-1 pb-3 border-b border-dashed border-slate-700">
              <div className="flex justify-between">
                <span>TERMINAL:</span>
                <span>POS 01</span>
              </div>
              <div className="flex justify-between">
                <span>TOTAL TRANSACTIONS:</span>
                <span>{sales.length}</span>
              </div>
              <div className="flex justify-between">
                <span>ITEMS SOLD:</span>
                <span>{totalItemsSold}</span>
              </div>
            </div>

            <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-700">
              <div className="flex justify-between font-bold text-slate-300">
                <span>PAYMENT RECONCILIATION</span>
              </div>
              <div className="flex justify-between">
                <span>CASH IN DRAWER:</span>
                <span className="font-bold text-emerald-400">{currency} {cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>CARD TERMINAL:</span>
                <span className="font-bold text-blue-400">{currency} {cardSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>QR / UPI PAYMENTS:</span>
                <span className="font-bold text-amber-400">{currency} {qrSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>REFUNDS ISSUED:</span>
                <span>-{currency} {refundedSales.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-sm font-bold text-white pt-1">
              <span>NET REGISTER TOTAL:</span>
              <span className="text-emerald-400">{currency} {totalSalesRevenue.toFixed(2)}</span>
            </div>

            <div className="pt-4 text-center">
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
              >
                Print Official Z-Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: PROFIT & LOSS (P&L) */}
      {reportTab === 'pnl' && (
        <div className="flex-1 flex justify-center overflow-y-auto p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Supermarket Profit & Loss (P&L) Statement</h3>
              <p className="text-[11px] text-slate-400">Summary calculated from sales revenue, wholesale COGS, and daily expenses</p>
            </div>

            <div className="space-y-3">
              {/* Revenue */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">1. Total Revenue</span>
                <div className="flex justify-between font-mono text-sm font-bold text-white">
                  <span>Gross Sales</span>
                  <span>{currency} {totalSalesRevenue.toFixed(2)}</span>
                </div>
              </div>

              {/* COGS */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">2. Cost of Goods Sold (COGS)</span>
                <div className="flex justify-between font-mono text-sm font-bold text-slate-200">
                  <span>Wholesale Inventory Cost</span>
                  <span>-{currency} {totalCOGS.toFixed(2)}</span>
                </div>
              </div>

              {/* Gross Margin */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex justify-between items-center font-bold">
                <span className="text-slate-200">Gross Profit (Margin: {totalSalesRevenue > 0 ? ((grossProfit / totalSalesRevenue) * 100).toFixed(1) : 0}%)</span>
                <span className="font-mono text-base text-emerald-400">{currency} {grossProfit.toFixed(2)}</span>
              </div>

              {/* Expenses */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">3. Operational Expenses</span>
                <div className="flex justify-between font-mono text-sm font-bold text-slate-200">
                  <span>Utilities, Salaries, Rent, Transport</span>
                  <span>-{currency} {totalExpenses.toFixed(2)}</span>
                </div>
              </div>

              {/* Net Operating Profit */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/40 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold uppercase text-emerald-400">Net Operating Profit</span>
                  <p className="text-[10px] text-slate-400">True supermarket bottom-line</p>
                </div>
                <span className={`text-xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {currency} {netProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
