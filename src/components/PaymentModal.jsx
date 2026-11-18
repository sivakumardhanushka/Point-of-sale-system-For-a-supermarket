import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Banknote, 
  QrCode, 
  CheckCircle2, 
  X, 
  Smartphone, 
  Printer, 
  Award, 
  Layers,
  ArrowRight,
  Wallet,
  AlertTriangle,
  MessageSquare,
  ShieldAlert,
  Zap,
  Loader2,
  CheckCircle,
  ShoppingBag
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSms } from '../hooks/useSms';

export default function PaymentModal({ 
  cart, 
  subtotal, 
  discount, 
  tax, 
  bagCharge = 0,
  total, 
  selectedCustomer, 
  settings, 
  onClose, 
  onCompleteSale 
}) {
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Cash, Card, QR, Split, Credit
  const [amountTendered, setAmountTendered] = useState(total);
  const [customerMobile, setCustomerMobile] = useState(selectedCustomer?.mobile || '');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(true);
  const [sendDigitalBill, setSendDigitalBill] = useState(Boolean(selectedCustomer?.mobile && selectedCustomer.mobile !== '0000000000'));
  const [sendCreditSms, setSendCreditSms] = useState(true);
  const [sendApiSms, setSendApiSms] = useState(false); // Twilio API SMS on sale complete
  const [allowCreditOverride, setAllowCreditOverride] = useState(false);
  
  // Split payment state
  const [cashAmount, setCashAmount] = useState(Math.round(total / 2));
  const [cardAmount, setCardAmount] = useState(total - Math.round(total / 2));

  // Twilio SMS hook
  const { sendSms, loading: smsLoading, result: smsResult, error: smsError, reset: resetSms } = useSms();

  const currency = settings.currency || 'Rs.';

  // Customer credit info
  const isWalkIn = !selectedCustomer || selectedCustomer.id === 'cust-walkin';
  const creditLimit = Number(selectedCustomer?.creditLimit || 0);
  const currentCreditBalance = Number(selectedCustomer?.creditBalance || 0);
  const newCreditBalance = currentCreditBalance + total;
  const availableCredit = Math.max(0, creditLimit - currentCreditBalance);
  const isCreditExceeded = newCreditBalance > creditLimit;

  // Loyalty points discount calculation
  const customerPoints = selectedCustomer?.points || 0;
  const maxRedeemablePoints = Math.min(customerPoints, Math.floor(total * 0.5)); // Can redeem up to 50% of bill
  const loyaltyDiscount = redeemPoints ? (maxRedeemablePoints * (settings.loyaltyRedeemValue || 1.0)) : 0;
  
  const finalPayable = Math.max(0, total - loyaltyDiscount + (Number(bagCharge) || 0));

  useEffect(() => {
    setAmountTendered(finalPayable);
    setCashAmount(Math.round(finalPayable / 2));
    setCardAmount(finalPayable - Math.round(finalPayable / 2));
  }, [finalPayable]);

  const changeDue = Math.max(0, (Number(amountTendered) || 0) - finalPayable);

  const handleQuickCash = (addAmount) => {
    if (addAmount === 'exact') {
      setAmountTendered(finalPayable);
    } else {
      setAmountTendered(prev => (Number(prev) || 0) + addAmount);
    }
  };

  const handleFinish = () => {
    if (paymentMethod === 'Cash' && Number(amountTendered) < finalPayable) {
      alert(`Tendered amount is less than total payable (${currency} ${finalPayable.toFixed(2)})`);
      return;
    }

    if (paymentMethod === 'Split') {
      const splitTotal = Number(cashAmount) + Number(cardAmount);
      if (Math.abs(splitTotal - finalPayable) > 0.01) {
        alert(`Split total (${currency} ${splitTotal}) must equal total payable (${currency} ${finalPayable})`);
        return;
      }
    }

    if (paymentMethod === 'Credit') {
      if (isWalkIn) {
        alert('Credit billing cannot be issued to Walk-in customer. Please select or register a credit customer first.');
        return;
      }
      if (selectedCustomer.creditAllowed === false) {
        alert('Credit facility is disabled for this customer. Please check customer profile in CRM.');
        return;
      }
      if (isCreditExceeded && !allowCreditOverride) {
        alert(`Credit limit exceeded! Customer credit limit is ${currency} ${creditLimit.toFixed(2)}. New total would be ${currency} ${newCreditBalance.toFixed(2)}. Please check Supervisor Override checkbox to authorize.`);
        return;
      }
    }

    // Trigger celebratory confetti on checkout
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10b981', '#06b6d4', '#f59e0b']
      });
    } catch (e) {}

    // Auto-send Twilio API SMS if opted-in and mobile available
    if (sendApiSms && customerMobile.trim()) {
      const storeName = settings.storeName || 'Store';
      const cur = settings.currency || 'Rs.';
      const custName = selectedCustomer?.name || 'Customer';
      const smsBody = `${storeName}: Dear ${custName}, your purchase of ${cur} ${finalPayable.toFixed(2)} (${paymentMethod}) is confirmed. Thank you for shopping with us!`;
      sendSms(customerMobile, smsBody);
    }

    const saleRecord = {
      items: cart,
      subtotal,
      discount: discount + loyaltyDiscount,
      pointsRedeemed: redeemPoints ? maxRedeemablePoints : 0,
      tax,
      bagCharge: Number(bagCharge) || 0,
      total: finalPayable,
      paymentMethod,
      amountPaid: paymentMethod === 'Cash' ? Number(amountTendered) : (paymentMethod === 'Credit' ? 0 : finalPayable),
      changeDue: paymentMethod === 'Cash' ? changeDue : 0,
      customerId: selectedCustomer?.id || 'cust-walkin',
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerMobile: customerMobile,
      printReceiptRequested: printReceipt,
      sendDigitalBillRequested: sendDigitalBill,
      sendCreditSmsRequested: paymentMethod === 'Credit' && sendCreditSms,
      creditIncreaseAmount: paymentMethod === 'Credit' ? finalPayable : 0,
      newCreditBalance: paymentMethod === 'Credit' ? (currentCreditBalance + finalPayable) : currentCreditBalance,
      splitDetails: paymentMethod === 'Split' ? { cash: cashAmount, card: cardAmount } : null
    };

    onCompleteSale(saleRecord);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700 text-white">
          <div className="flex items-center space-x-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-lg">Checkout & Payment</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          
          {/* Total Payable Banner */}
          <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">Total Net Payable</span>
              <div className="text-3xl font-black font-mono text-white tracking-tight">
                {currency} {finalPayable.toFixed(2)}
              </div>
              {loyaltyDiscount > 0 && (
                <span className="text-xs text-emerald-300 font-medium">
                  Includes loyalty savings of {currency} {loyaltyDiscount.toFixed(2)}
                </span>
              )}
              {Number(bagCharge) > 0 && (
                <span className="flex items-center gap-1 text-xs text-teal-300 font-medium mt-0.5">
                  <ShoppingBag className="w-3 h-3" />
                  Bag charge: +{currency} {Number(bagCharge).toFixed(2)}
                </span>
              )}
            </div>

            {/* Customer Info Badge */}
            <div className="text-right">
              <span className="text-xs text-slate-400">Customer</span>
              <p className="text-sm font-bold text-slate-200">{selectedCustomer?.name || 'Walk-in Customer'}</p>
              {customerPoints > 0 && (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/50 border border-amber-800/60 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  ★ {customerPoints} Points
                </span>
              )}
            </div>
          </div>

          {/* Loyalty Redemption Option */}
          {customerPoints > 0 && (
            <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 p-3 rounded-lg text-xs">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-semibold text-slate-200">Redeem Loyalty Points</p>
                  <p className="text-slate-400">Available: {customerPoints} pts (Use {maxRedeemablePoints} pts for {currency} {maxRedeemablePoints})</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.checked)}
                className="w-5 h-5 accent-emerald-500 cursor-pointer rounded"
              />
            </div>
          )}

          {/* Payment Method Tabs */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Select Payment Mode</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'Cash', icon: Banknote, label: 'Cash' },
                { id: 'Card', icon: CreditCard, label: 'Card' },
                { id: 'QR / UPI', icon: QrCode, label: 'QR / Bank' },
                { id: 'Split', icon: Layers, label: 'Split Pay' },
                { id: 'Credit', icon: Wallet, label: 'Credit Khata' }
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? (m.id === 'Credit' 
                            ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                            : 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950')
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mb-1 ${isSelected ? (m.id === 'Credit' ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-400'}`} />
                    <span className="text-[11px] truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Payment Method Fields */}
          {paymentMethod === 'Cash' && (
            <div className="space-y-3 bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Cash Tendered ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-xl font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex-1 bg-slate-900/90 border border-slate-700 rounded-lg p-3 text-right">
                  <span className="text-xs text-slate-400 font-semibold uppercase">Change Due</span>
                  <div className={`text-2xl font-black font-mono ${changeDue > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {currency} {changeDue.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Quick Tender:</span>
                {[100, 500, 1000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickCash(amt)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-mono font-semibold text-slate-200 transition"
                  >
                    +{amt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleQuickCash('exact')}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-700/60 rounded text-xs font-semibold text-emerald-300 transition"
                >
                  Exact
                </button>
              </div>
            </div>
          )}

          {paymentMethod === 'Card' && (
            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-3 text-xs text-slate-300">
              <CreditCard className="w-8 h-8 text-blue-400 shrink-0" />
              <div>
                <p className="font-semibold text-white">POS Card Terminal Swipe / Chip</p>
                <p className="text-slate-400">Process {currency} {finalPayable.toFixed(2)} on customer card machine and confirm transaction.</p>
              </div>
            </div>
          )}

          {paymentMethod === 'QR / UPI' && (
            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl flex items-center space-x-4 text-xs">
              <div className="bg-white p-2 rounded-lg shrink-0">
                <QrCode className="w-14 h-14 text-slate-950" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-white text-sm">Dynamic LankaQR / UPI Payment</p>
                <p className="text-slate-300">Amount: <span className="font-mono font-bold text-emerald-400">{currency} {finalPayable.toFixed(2)}</span></p>
                <p className="text-slate-400 text-[11px]">Ask customer to scan with any banking app.</p>
              </div>
            </div>
          )}

          {paymentMethod === 'Split' && (
            <div className="bg-slate-800/40 border border-slate-700/60 p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Cash Portion ({currency})</label>
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Card Portion ({currency})</label>
                  <input
                    type="number"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono text-white"
                  />
                </div>
              </div>
              <div className="text-[11px] text-right font-mono text-slate-400">
                Split sum: {currency} {(Number(cashAmount) + Number(cardAmount)).toFixed(2)} / Required: {currency} {finalPayable.toFixed(2)}
              </div>
            </div>
          )}

          {/* Credit Khata Payment Panel */}
          {paymentMethod === 'Credit' && (
            <div className="bg-amber-950/20 border border-amber-800/50 p-4 rounded-xl space-y-3 text-xs">
              {isWalkIn ? (
                <div className="flex items-start space-x-2.5 p-3 bg-rose-950/60 border border-rose-800/60 rounded-lg text-rose-300">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Walk-in Customer Not Eligible for Credit</h5>
                    <p className="text-[11px] text-rose-300/80 mt-0.5">
                      Credit sales can only be assigned to registered credit members with an approved credit limit.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Credit Status Breakdown */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Credit Limit</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {currency} {creditLimit.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-x border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Khata</span>
                      <span className="text-xs font-mono font-bold text-white">
                        {currency} {currentCreditBalance.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">New Total Due</span>
                      <span className={`text-xs font-mono font-bold ${isCreditExceeded ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {currency} {newCreditBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Warning if Credit Limit Exceeded */}
                  {isCreditExceeded ? (
                    <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-lg space-y-2 text-rose-200">
                      <div className="flex items-center space-x-2 font-bold text-rose-300">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Warning: Credit Limit Exceeded by {currency} {(newCreditBalance - creditLimit).toFixed(2)}</span>
                      </div>
                      <p className="text-[11px] text-rose-300/80">
                        This purchase exceeds customer's authorized limit ({currency} {creditLimit.toFixed(2)}).
                      </p>
                      <label className="flex items-center space-x-2 pt-1 cursor-pointer font-semibold text-xs text-white">
                        <input
                          type="checkbox"
                          checked={allowCreditOverride}
                          onChange={(e) => setAllowCreditOverride(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded"
                        />
                        <span>Authorize Supervisor / Manager Override</span>
                      </label>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-slate-300 text-[11px] px-1">
                      <span>Remaining Available Limit after this bill:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {currency} {(creditLimit - newCreditBalance).toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Normal SMS Alert Checkbox */}
                  <div className="pt-2 border-t border-amber-900/40 flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={sendCreditSms}
                        onChange={(e) => setSendCreditSms(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded"
                      />
                      <span className="font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Trigger Normal SMS to Customer Mobile</span>
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">{customerMobile || 'No mobile'}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Customer Mobile for Digital Receipt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Customer Mobile (Digital Bill)</label>
              <div className="flex items-center space-x-3 text-xs">
                <label className="flex items-center space-x-1 cursor-pointer text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={printReceipt} 
                    onChange={(e) => setPrintReceipt(e.target.checked)} 
                    className="accent-emerald-500 rounded" 
                  />
                  <span>Print Slip</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer text-slate-300">
                  <input 
                    type="checkbox" 
                    checked={sendDigitalBill} 
                    onChange={(e) => setSendDigitalBill(e.target.checked)} 
                    className="accent-emerald-500 rounded" 
                  />
                  <span>Send WhatsApp</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer text-violet-300" title="Send confirmation SMS via Twilio API on sale completion">
                  <input 
                    type="checkbox" 
                    checked={sendApiSms} 
                    onChange={(e) => { setSendApiSms(e.target.checked); resetSms(); }} 
                    className="accent-violet-500 rounded" 
                  />
                  <Zap className="w-3 h-3 text-violet-400" />
                  <span>Send SMS</span>
                </label>
              </div>
            </div>
            <input
              type="tel"
              placeholder="e.g. 0771234567"
              value={customerMobile}
              onChange={(e) => {
                setCustomerMobile(e.target.value);
                if (e.target.value.length >= 7) setSendDigitalBill(true);
                resetSms();
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />

            {/* Twilio SMS API feedback */}
            {smsLoading && (
              <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/60 border border-blue-700/60 p-2 rounded-lg animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Sending SMS via Twilio API…</span>
              </div>
            )}
            {smsResult && !smsLoading && (
              <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 p-2 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>SMS sent! SID: <span className="font-mono">{smsResult.sid}</span></span>
              </div>
            )}
            {smsError && !smsLoading && (
              <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/60 border border-rose-700/60 p-2 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span>SMS error: {smsError}</span>
              </div>
            )}
          </div>

        </div>

        {/* Bottom Actions */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold transition cursor-pointer"
          >
            Cancel (Esc)
          </button>

          <button
            onClick={handleFinish}
            className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 flex items-center space-x-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Sale (Enter)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
