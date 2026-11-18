import React, { useState, useEffect } from 'react';
import { storage, playSound } from './db/storage';
import Navbar from './components/Navbar';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Purchasing from './pages/Purchasing';
import Customers from './pages/Customers';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import DigitalQueue from './pages/DigitalQueue';
import Settings from './pages/Settings';
import ThermalReceipt from './components/ThermalReceipt';
import DigitalBillModal from './components/DigitalBillModal';
import PaymentModal from './components/PaymentModal';
import HoldBillsModal from './components/HoldBillsModal';
import RefundModal from './components/RefundModal';
import ShortcutsHelpModal from './components/ShortcutsHelpModal';
import LoginModal from './components/LoginModal';
import AdminOverrideModal from './components/AdminOverrideModal';
import CreditSmsModal from './components/CreditSmsModal';

export default function App() {
  const [dbData, setDbData] = useState(() => storage.getAll());
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUserId = localStorage.getItem('pos_active_user_id');
    if (savedUserId && dbData.users) {
      const savedUser = dbData.users.find(u => u.id === savedUserId);
      if (savedUser) return savedUser;
    }
    // Default directly to Dhanush (Software Engineer / Creator / Full Master Access)
    const dhanush = dbData.users?.find(u => u.username === 'dhanush' || u.isCreator);
    return dhanush || dbData.users?.[0];
  });
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState('pos');
  
  // Modals
  const [activePaymentSaleData, setActivePaymentSaleData] = useState(null);
  const [activeReceiptSale, setActiveReceiptSale] = useState(null);
  const [activeDigitalBillSale, setActiveDigitalBillSale] = useState(null);
  const [activeCreditSmsSale, setActiveCreditSmsSale] = useState(null);
  const [holdBills, setHoldBills] = useState([]);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [adminOverridePending, setAdminOverridePending] = useState(null); // callback or true

  // Dark & White / Light theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('pos_theme') || dbData.settings?.theme || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-dark');
    } else {
      document.documentElement.classList.add('theme-dark');
      document.documentElement.classList.remove('theme-light');
    }
    localStorage.setItem('pos_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Reload data from storage
  const reloadData = () => {
    setDbData(storage.getAll());
  };

  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem('pos_active_user_id', currentUser.id);
    }
  }, [currentUser]);

  const isDhanush = currentUser?.username === 'dhanush' || currentUser?.isCreator;
  const isAdminOrManager = isDhanush || currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Keyboard shortcut listener (F1 - F12, Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isLocked) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (isAdminOrManager) setActiveTab('inventory');
        else handleRequireAdmin(() => setActiveTab('inventory'));
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (isAdminOrManager) setActiveTab('purchasing');
        else handleRequireAdmin(() => setActiveTab('purchasing'));
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('customers');
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (isAdminOrManager) setActiveTab('expenses');
        else handleRequireAdmin(() => setActiveTab('expenses'));
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('reports');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('digitalQueue');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (isAdminOrManager) setActiveTab('settings');
        else handleRequireAdmin(() => setActiveTab('settings'));
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsHoldModalOpen(true);
      } else if (e.key === 'F12') {
        e.preventDefault();
        setIsRefundModalOpen(true);
      } else if (e.key === 'Escape') {
        // Close modals on escape
        setActivePaymentSaleData(null);
        setActiveReceiptSale(null);
        setActiveDigitalBillSale(null);
        setActiveCreditSmsSale(null);
        setIsHoldModalOpen(false);
        setIsRefundModalOpen(false);
        setIsShortcutsModalOpen(false);
        setAdminOverridePending(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, currentUser, isAdminOrManager]);

  // Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLocked(false);
    setActiveTab('pos');
  };

  const handleLogout = () => {
    setIsLocked(true);
  };

  const handleRequireAdmin = (actionCallback) => {
    setAdminOverridePending(() => actionCallback || true);
  };

  const handleAdminApproved = (adminUser) => {
    const callback = adminOverridePending;
    setAdminOverridePending(null);

    // If user clicked "Admin Mode", switch session to this admin
    if (typeof callback === 'function') {
      callback();
    } else {
      setCurrentUser(adminUser);
      alert(`Supervisor authorization granted. Switched to ${adminUser.name} (${adminUser.role.toUpperCase()})`);
    }
  };

  const handleInitiatePayment = (cartSummary) => {
    setActivePaymentSaleData(cartSummary);
  };

  const handleFinishSale = (saleDetails) => {
    const completeRecord = {
      ...saleDetails,
      cashierId: currentUser.id,
      cashierName: currentUser.name
    };

    const savedSale = storage.recordSale(completeRecord);
    reloadData();
    setActivePaymentSaleData(null);
    playSound('checkout');

    // Trigger Normal SMS alert modal if credit was increased and requested
    if (saleDetails.sendCreditSmsRequested) {
      const cust = dbData.customers.find(c => c.id === saleDetails.customerId);
      setActiveCreditSmsSale({
        customer: cust,
        creditAmount: saleDetails.creditIncreaseAmount,
        invoiceNo: savedSale.invoiceNo,
        newBalance: saleDetails.newCreditBalance
      });
    }

    // Show thermal receipt preview if requested
    if (saleDetails.printReceiptRequested) {
      setActiveReceiptSale(savedSale);
    } else if (saleDetails.sendDigitalBillRequested) {
      setActiveDigitalBillSale(savedSale);
    }
  };

  const handleHoldBill = (bill) => {
    setHoldBills(prev => [bill, ...prev]);
  };

  const handleResumeBill = (bill) => {
    setHoldBills(prev => prev.filter(b => b.id !== bill.id));
    setIsHoldModalOpen(false);
    setActiveTab('pos');
    window.dispatchEvent(new CustomEvent('pos-resume-cart', { detail: bill }));
  };

  const handleDeleteHeldBill = (billId) => {
    setHoldBills(prev => prev.filter(b => b.id !== billId));
  };

  const handleProcessRefund = (saleId, itemsToReturn, refundAmount, reason) => {
    storage.refundSale(saleId, itemsToReturn, refundAmount, reason);
    reloadData();
    playSound('checkout');
    alert(`Refund of ${dbData.settings.currency || 'Rs.'} ${refundAmount.toFixed(2)} processed successfully! Stock restocked.`);
  };

  const handleSaveProduct = (product) => {
    storage.saveProduct(product);
    reloadData();
  };

  const handleDeleteProduct = (productId) => {
    storage.deleteProduct(productId);
    reloadData();
  };

  const handleAdjustStock = (productId, delta, reason) => {
    storage.adjustStock(productId, delta, reason);
    reloadData();
  };

  const handleRecordPurchase = (purchase) => {
    storage.recordPurchase(purchase);
    reloadData();
  };

  const handleSaveSupplier = (supplier) => {
    storage.saveSupplier(supplier);
    reloadData();
  };

  const handleSaveCustomer = (customer) => {
    storage.saveCustomer(customer);
    reloadData();
  };

  const handleSettleCustomerCredit = (customerId, amount, paymentMethod, notes) => {
    storage.settleCustomerCredit(customerId, amount, paymentMethod, notes);
    reloadData();
    playSound('checkout');
  };

  const handleSettlePurchaseBill = (purchaseId, amount, paymentMethod, notes) => {
    storage.settlePurchaseBill(purchaseId, amount, paymentMethod, notes);
    reloadData();
    playSound('checkout');
  };

  const handleRecordExpense = (expense) => {
    storage.recordExpense(expense);
    reloadData();
  };

  const handleUpdateSettings = (newSettings) => {
    storage.updateSettings(newSettings);
    reloadData();
  };

  const handleProcessQueue = () => {
    storage.processDigitalBillQueue();
    reloadData();
  };

  const handleSaveUser = (user) => {
    storage.saveUser(user);
    reloadData();
    if (currentUser?.id === user.id) {
      setCurrentUser(prev => ({ ...prev, ...user }));
    }
  };

  const handleUpdateUserPin = (userId, newPin) => {
    storage.updateUserPin(userId, newPin);
    reloadData();
    if (currentUser?.id === userId) {
      setCurrentUser(prev => ({ ...prev, pin: String(newPin) }));
    }
  };

  const handleDeleteUser = (userId) => {
    try {
      storage.deleteUser(userId);
      reloadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Badge counts
  const lowStockCount = dbData.products.filter(p => p.currentStock > 0 && p.currentStock <= p.minStock).length;
  const pendingBillsCount = dbData.digitalBillQueue?.filter(q => q.status === 'Pending').length || 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      
      {/* Top Main Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        onRequireAdmin={handleRequireAdmin}
        settings={dbData.settings}
        lowStockCount={lowStockCount}
        pendingBillsCount={pendingBillsCount}
        onOpenShortcuts={() => setIsShortcutsModalOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Screen Router */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'pos' && (
          <POS
            products={dbData.products}
            categories={dbData.categories}
            customers={dbData.customers}
            settings={dbData.settings}
            onCompleteSale={handleInitiatePayment}
            onHoldBill={handleHoldBill}
            holdBills={holdBills}
            onOpenHoldModal={() => setIsHoldModalOpen(true)}
            onOpenRefundModal={() => setIsRefundModalOpen(true)}
            onSaveProduct={handleSaveProduct}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            products={dbData.products}
            categories={dbData.categories}
            onSaveProduct={handleSaveProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
            settings={dbData.settings}
          />
        )}

        {activeTab === 'purchasing' && (
          <Purchasing
            suppliers={dbData.suppliers}
            purchases={dbData.purchases}
            products={dbData.products}
            onRecordPurchase={handleRecordPurchase}
            onSaveSupplier={handleSaveSupplier}
            onSettlePurchaseBill={handleSettlePurchaseBill}
            settings={dbData.settings}
          />
        )}

        {activeTab === 'customers' && (
          <Customers
            customers={dbData.customers}
            sales={dbData.sales}
            onSaveCustomer={handleSaveCustomer}
            onSettleCustomerCredit={handleSettleCustomerCredit}
            settings={dbData.settings}
          />
        )}

        {activeTab === 'expenses' && (
          <Expenses
            expenses={dbData.expenses}
            onRecordExpense={handleRecordExpense}
            settings={dbData.settings}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            sales={dbData.sales}
            products={dbData.products}
            expenses={dbData.expenses}
            settings={dbData.settings}
            currentUser={currentUser}
            onSelectSaleForPrint={(sale) => setActiveReceiptSale(sale)}
          />
        )}

        {activeTab === 'digitalQueue' && (
          <DigitalQueue
            queue={dbData.digitalBillQueue || []}
            onProcessQueue={handleProcessQueue}
            settings={dbData.settings}
          />
        )}

        {activeTab === 'settings' && (
          <Settings
            settings={dbData.settings}
            onUpdateSettings={handleUpdateSettings}
            users={dbData.users}
            currentUser={currentUser}
            onSaveUser={handleSaveUser}
            onUpdateUserPin={handleUpdateUserPin}
            onDeleteUser={handleDeleteUser}
            onReloadAll={reloadData}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />
        )}
      </main>

      {/* Lock Screen Modal */}
      {isLocked && (
        <LoginModal
          users={dbData.users}
          settings={dbData.settings}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {/* Supervisor / Admin PIN Override Modal */}
      {adminOverridePending && (
        <AdminOverrideModal
          users={dbData.users}
          onApproved={handleAdminApproved}
          onClose={() => setAdminOverridePending(null)}
        />
      )}

      {/* Payment Modal */}
      {activePaymentSaleData && (
        <PaymentModal
          cart={activePaymentSaleData.cart}
          subtotal={activePaymentSaleData.subtotal}
          discount={activePaymentSaleData.discount}
          tax={activePaymentSaleData.tax}
          bagCharge={activePaymentSaleData.bagCharge || 0}
          total={activePaymentSaleData.total}
          selectedCustomer={activePaymentSaleData.customer}
          settings={dbData.settings}
          onClose={() => setActivePaymentSaleData(null)}
          onCompleteSale={handleFinishSale}
        />
      )}

      {/* Thermal Receipt Print Preview Modal */}
      {activeReceiptSale && (
        <ThermalReceipt
          sale={activeReceiptSale}
          settings={dbData.settings}
          onClose={() => setActiveReceiptSale(null)}
          onShareDigital={() => {
            setActiveDigitalBillSale(activeReceiptSale);
            setActiveReceiptSale(null);
          }}
        />
      )}

      {/* Digital Mobile Bill Preview & WhatsApp Share Modal */}
      {activeDigitalBillSale && (
        <DigitalBillModal
          sale={activeDigitalBillSale}
          settings={dbData.settings}
          onClose={() => setActiveDigitalBillSale(null)}
        />
      )}

      {/* Hold / Parked Bills Modal */}
      {isHoldModalOpen && (
        <HoldBillsModal
          holdBills={holdBills}
          onResumeBill={handleResumeBill}
          onDeleteBill={handleDeleteHeldBill}
          onClose={() => setIsHoldModalOpen(false)}
          currency={dbData.settings.currency}
        />
      )}

      {/* Sales Return / Refund Modal */}
      {isRefundModalOpen && (
        <RefundModal
          sales={dbData.sales}
          onProcessRefund={handleProcessRefund}
          onClose={() => setIsRefundModalOpen(false)}
          currency={dbData.settings.currency}
        />
      )}

      {/* Keyboard Shortcuts Sheet Modal */}
      {isShortcutsModalOpen && (
        <ShortcutsHelpModal
          onClose={() => setIsShortcutsModalOpen(false)}
        />
      )}

      {/* Credit Increase Normal SMS Notification Modal */}
      {activeCreditSmsSale && (
        <CreditSmsModal
          customer={activeCreditSmsSale.customer}
          creditAmount={activeCreditSmsSale.creditAmount}
          invoiceNo={activeCreditSmsSale.invoiceNo}
          newBalance={activeCreditSmsSale.newBalance}
          settings={dbData.settings}
          onClose={() => setActiveCreditSmsSale(null)}
        />
      )}

    </div>
  );
}
