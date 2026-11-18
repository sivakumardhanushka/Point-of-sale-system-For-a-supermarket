import { initialData } from './initialData';

const DB_KEY = 'supermarket_pos_db_v1';

export const storage = {
  init() {
    const existing = localStorage.getItem(DB_KEY);
    if (!existing) {
      this.saveAll(initialData);
      return initialData;
    }
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error('Failed to parse database, resetting with seed data', e);
      this.saveAll(initialData);
      return initialData;
    }
  },

  getAll() {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return this.init();
    try {
      const data = JSON.parse(raw);
      let needsSave = false;
      // Ensure settings has new logo and SMS properties
      if (!data.settings?.logoUrl) {
        data.settings = { ...initialData.settings, ...data.settings };
        needsSave = true;
      }
      // Ensure tax charges are removed (set to 0)
      if (data.settings && data.settings.taxRate !== 0) {
        data.settings.taxRate = 0;
        needsSave = true;
      }
      if (Array.isArray(data.products)) {
        data.products.forEach(p => {
          if (p.taxRate && p.taxRate !== 0) {
            p.taxRate = 0;
            needsSave = true;
          }
        });
      }
      // Migrate: add label printer & driver fields if missing
      if (data.settings) {
        if (data.settings.labelPrinterEnabled === undefined) {
          data.settings.labelPrinterEnabled = true;
          needsSave = true;
        }
        if (data.settings.labelPrinterDriver === undefined) {
          data.settings.labelPrinterDriver = '';
          data.settings.labelPrinterDriverPreset = 'Generic';
          data.settings.labelPrintSpeed = '3';
          data.settings.labelShowStoreName = true;
          data.settings.labelPrinterConnection = data.settings.labelPrinterConnection || 'USB';
          data.settings.labelWidth = data.settings.labelWidth || '50';
          data.settings.labelHeight = data.settings.labelHeight || '30';
          data.settings.labelGapType = data.settings.labelGapType || 'gap';
          data.settings.labelDarkness = data.settings.labelDarkness || '8';
          data.settings.labelCopies = data.settings.labelCopies || '1';
          needsSave = true;
        }
      }
      // Ensure existing customers have credit fields
      if (Array.isArray(data.customers)) {
        data.customers.forEach((c, i) => {
          if (c.creditAllowed === undefined) {
            c.creditAllowed = c.id !== 'cust-walkin';
            c.creditLimit = c.creditLimit || (c.id === 'cust-walkin' ? 0 : 30000);
            c.creditBalance = Number(c.creditBalance) || 0;
            c.creditBarcode = c.creditBarcode || (c.id === 'cust-walkin' ? '' : `CR-${1000 + i}`);
            c.creditHistory = Array.isArray(c.creditHistory) ? c.creditHistory : [];
            needsSave = true;
          }
        });
      }
      // Ensure staple products exist
      if (Array.isArray(data.products)) {
        initialData.products.forEach(initPrd => {
          if (!data.products.some(p => p.id === initPrd.id)) {
            data.products.push(initPrd);
            needsSave = true;
          }
        });
      }

      // Ensure Dhanush (Software Engineer / Creator / Super Admin) account exists
      if (Array.isArray(data.users)) {
        if (!data.users.some(u => u.username === 'dhanush' || u.id === 'usr-dhanush')) {
          data.users.unshift({
            id: 'usr-dhanush',
            username: 'dhanush',
            pin: '9999',
            role: 'admin',
            name: 'Dhanush (Software Engineer)',
            isCreator: true,
            active: true
          });
          needsSave = true;
        }
      }

      if (needsSave) {
        this.saveAll(data);
      }
      return data;
    } catch (e) {
      return this.init();
    }
  },

  saveAll(data) {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  },

  // Settings
  getSettings() {
    return this.getAll().settings || initialData.settings;
  },

  updateSettings(newSettings) {
    const data = this.getAll();
    data.settings = { ...data.settings, ...newSettings };
    this.saveAll(data);
    return data.settings;
  },

  // Products
  getProducts() {
    return this.getAll().products || [];
  },

  getProductByBarcode(barcode) {
    const products = this.getProducts();
    const clean = String(barcode).trim();
    return products.find(p => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase() || p.id === clean);
  },

  saveProduct(product) {
    const data = this.getAll();
    const index = data.products.findIndex(p => p.id === product.id);
    if (index >= 0) {
      data.products[index] = { ...data.products[index], ...product };
    } else {
      const newProduct = {
        ...product,
        id: product.id || `prd-${Date.now()}`,
        currentStock: Number(product.currentStock) || 0,
        costPrice: Number(product.costPrice) || 0,
        sellingPrice: Number(product.sellingPrice) || 0,
        minStock: Number(product.minStock) || 10,
        taxRate: Number(product.taxRate) || 0,
        isActive: product.isActive !== false
      };
      data.products.unshift(newProduct);
    }
    this.saveAll(data);
    return data.products;
  },

  deleteProduct(id) {
    const data = this.getAll();
    data.products = data.products.filter(p => p.id !== id);
    this.saveAll(data);
    return data.products;
  },

  adjustStock(productId, adjustmentQty, reason = 'Adjustment') {
    const data = this.getAll();
    const prd = data.products.find(p => p.id === productId);
    if (prd) {
      prd.currentStock = Math.max(0, (Number(prd.currentStock) || 0) + Number(adjustmentQty));
      this.saveAll(data);
    }
    return data.products;
  },

  // Sales
  getSales() {
    return this.getAll().sales || [];
  },

  recordSale(sale) {
    const data = this.getAll();
    
    // Decrement inventory stock
    if (Array.isArray(sale.items)) {
      sale.items.forEach(item => {
        const prd = data.products.find(p => p.id === item.productId);
        if (prd) {
          prd.currentStock = Math.max(0, (Number(prd.currentStock) || 0) - Number(item.qty));
        }
      });
    }

    // Update customer loyalty points, spend, and credit balance if customer linked
    if (sale.customerId && sale.customerId !== 'cust-walkin') {
      const cust = data.customers.find(c => c.id === sale.customerId);
      if (cust) {
        const pointsEarned = Math.floor((sale.total || 0) * (data.settings.loyaltyRate || 0.01));
        const pointsRedeemed = Number(sale.pointsRedeemed) || 0;
        cust.points = Math.max(0, (Number(cust.points) || 0) + pointsEarned - pointsRedeemed);
        cust.totalSpent = (Number(cust.totalSpent) || 0) + Number(sale.total || 0);

        // Process credit purchase if paid with Credit / Split Credit
        let creditPortion = 0;
        if (sale.paymentMethod === 'Credit') {
          creditPortion = Number(sale.total) || 0;
        } else if (sale.paymentMethod === 'Split' && sale.splitDetails?.credit) {
          creditPortion = Number(sale.splitDetails.credit) || 0;
        }

        if (creditPortion > 0) {
          cust.creditBalance = (Number(cust.creditBalance) || 0) + creditPortion;
          if (!Array.isArray(cust.creditHistory)) cust.creditHistory = [];
          cust.creditHistory.unshift({
            id: `cr-${Date.now()}`,
            date: new Date().toISOString().slice(0, 10),
            timestamp: new Date().toISOString(),
            type: 'CHARGE',
            amount: creditPortion,
            invoiceNo: sale.invoiceNo || `INV-${Date.now().toString().slice(-6)}`,
            balanceAfter: cust.creditBalance,
            notes: 'POS Credit Purchase'
          });
        }
      }
    }

    // Add to sales list
    const newSale = {
      ...sale,
      id: sale.id || `sale-${Date.now()}`,
      invoiceNo: sale.invoiceNo || `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(data.sales.length + 1).padStart(4, '0')}`,
      timestamp: new Date().toISOString(),
      status: 'Completed'
    };
    data.sales.unshift(newSale);

    // Queue digital bill if customer mobile is present
    if (sale.customerMobile && sale.customerMobile.length >= 7) {
      const queueItem = {
        id: `q-${Date.now()}`,
        saleId: newSale.id,
        invoiceNo: newSale.invoiceNo,
        customerMobile: sale.customerMobile,
        customerName: sale.customerName || 'Customer',
        total: newSale.total,
        status: navigator.onLine ? 'Sent' : 'Pending',
        queuedAt: new Date().toISOString(),
        sentAt: navigator.onLine ? new Date().toISOString() : null
      };
      data.digitalBillQueue.unshift(queueItem);
    }

    this.saveAll(data);
    return newSale;
  },

  refundSale(saleId, returnItems, refundAmount, reason) {
    const data = this.getAll();
    const sale = data.sales.find(s => s.id === saleId);
    if (!sale) throw new Error('Sale invoice not found');

    // Restock returned items
    returnItems.forEach(item => {
      const prd = data.products.find(p => p.id === item.productId);
      if (prd) {
        prd.currentStock += Number(item.qty);
      }
    });

    // Record refund on sale
    sale.status = 'Refunded';
    sale.refundInfo = {
      refundAmount,
      reason,
      refundedAt: new Date().toISOString(),
      items: returnItems
    };

    this.saveAll(data);
    return sale;
  },

  // Customers
  getCustomers() {
    return this.getAll().customers || [];
  },

  saveCustomer(customer) {
    const data = this.getAll();
    const index = data.customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      data.customers[index] = { 
        ...data.customers[index], 
        ...customer,
        creditLimit: Number(customer.creditLimit) >= 0 ? Number(customer.creditLimit) : data.customers[index].creditLimit || 0,
        creditBalance: Number(customer.creditBalance) >= 0 ? Number(customer.creditBalance) : data.customers[index].creditBalance || 0,
        creditAllowed: customer.creditAllowed !== false,
        creditBarcode: customer.creditBarcode || data.customers[index].creditBarcode || `CR-${Date.now().toString().slice(-4)}`
      };
    } else {
      const newCust = {
        ...customer,
        id: customer.id || `cust-${Date.now()}`,
        points: Number(customer.points) || 0,
        totalSpent: Number(customer.totalSpent) || 0,
        creditAllowed: customer.creditAllowed !== false,
        creditLimit: Number(customer.creditLimit) || 0,
        creditBalance: Number(customer.creditBalance) || 0,
        creditBarcode: customer.creditBarcode || `CR-${Date.now().toString().slice(-4)}`,
        creditHistory: Array.isArray(customer.creditHistory) ? customer.creditHistory : []
      };
      data.customers.push(newCust);
    }
    this.saveAll(data);
    return data.customers;
  },

  settleCustomerCredit(customerId, amountPaid, paymentMethod = 'Cash', notes = '') {
    const data = this.getAll();
    const cust = data.customers.find(c => c.id === customerId);
    if (!cust) throw new Error('Customer not found');

    const paymentNum = Math.min(Number(cust.creditBalance) || 0, Math.max(0, Number(amountPaid) || 0));
    cust.creditBalance = Math.max(0, (Number(cust.creditBalance) || 0) - paymentNum);

    if (!Array.isArray(cust.creditHistory)) cust.creditHistory = [];
    const receiptNo = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;

    cust.creditHistory.unshift({
      id: `cr-pay-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      timestamp: new Date().toISOString(),
      type: 'PAYMENT',
      amount: paymentNum,
      invoiceNo: receiptNo,
      balanceAfter: cust.creditBalance,
      paymentMethod,
      notes: notes || 'Customer Credit Balance Settlement'
    });

    this.saveAll(data);
    return { customer: cust, receiptNo, amountPaid: paymentNum, remainingBalance: cust.creditBalance };
  },

  // Suppliers & Purchases
  getSuppliers() {
    return this.getAll().suppliers || [];
  },

  saveSupplier(supplier) {
    const data = this.getAll();
    const index = data.suppliers.findIndex(s => s.id === supplier.id);
    if (index >= 0) {
      data.suppliers[index] = { ...data.suppliers[index], ...supplier };
    } else {
      const newSup = { ...supplier, id: supplier.id || `sup-${Date.now()}`, balance: Number(supplier.balance) || 0 };
      data.suppliers.push(newSup);
    }
    this.saveAll(data);
    return data.suppliers;
  },

  getPurchases() {
    return this.getAll().purchases || [];
  },

  recordPurchase(purchase) {
    const data = this.getAll();
    // Increase stock for inward products
    if (Array.isArray(purchase.items)) {
      purchase.items.forEach(item => {
        const prd = data.products.find(p => p.id === item.productId);
        if (prd) {
          prd.currentStock = (Number(prd.currentStock) || 0) + Number(item.qty);
          if (item.unitCost) prd.costPrice = Number(item.unitCost);
        }
      });
    }

    const totalVal = Number(purchase.totalAmount) || 0;
    const paidVal = Number(purchase.paidAmount) >= 0 ? Number(purchase.paidAmount) : (purchase.paymentStatus === 'Paid' ? totalVal : 0);
    const balDue = Math.max(0, totalVal - paidVal);

    // If purchase has unpaid / credit balance, record against supplier balance
    if (balDue > 0 && purchase.supplierId) {
      const sup = data.suppliers.find(s => s.id === purchase.supplierId);
      if (sup) {
        sup.balance = (Number(sup.balance) || 0) + balDue;
      }
    }

    const newPO = {
      ...purchase,
      id: purchase.id || `po-${Date.now()}`,
      orderNo: purchase.orderNo || `PO-${new Date().getFullYear()}-${String(data.purchases.length + 1).padStart(3, '0')}`,
      purchaseType: purchase.purchaseType || 'bill-to-bill',
      supplierBillNo: purchase.supplierBillNo || '',
      totalAmount: totalVal,
      paidAmount: paidVal,
      balanceDue: balDue,
      paymentStatus: balDue <= 0.01 ? 'Paid' : (paidVal > 0 ? 'Partial' : 'Credit'),
      date: purchase.date || new Date().toISOString().slice(0, 10),
      dueDate: purchase.dueDate || ''
    };
    data.purchases.unshift(newPO);
    this.saveAll(data);
    return newPO;
  },

  settlePurchaseBill(purchaseId, amountToPay, paymentMethod = 'Bank Transfer', notes = '') {
    const data = this.getAll();
    const po = data.purchases.find(p => p.id === purchaseId);
    if (!po) throw new Error('Purchase bill not found');

    const amount = Math.min(Number(po.balanceDue) || 0, Math.max(0, Number(amountToPay) || 0));
    po.paidAmount = (Number(po.paidAmount) || 0) + amount;
    po.balanceDue = Math.max(0, (Number(po.balanceDue) || 0) - amount);
    po.paymentStatus = po.balanceDue <= 0.01 ? 'Paid' : 'Partial';

    // Reduce supplier balance
    if (po.supplierId) {
      const sup = data.suppliers.find(s => s.id === po.supplierId);
      if (sup) {
        sup.balance = Math.max(0, (Number(sup.balance) || 0) - amount);
      }
    }

    if (!Array.isArray(po.payments)) po.payments = [];
    po.payments.push({
      id: `po-pay-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount,
      paymentMethod,
      notes: notes || 'Bill-to-Bill Payment Settlement'
    });

    this.saveAll(data);
    return po;
  },

  // Expenses
  getExpenses() {
    return this.getAll().expenses || [];
  },

  recordExpense(expense) {
    const data = this.getAll();
    const newExp = {
      ...expense,
      id: expense.id || `exp-${Date.now()}`,
      amount: Number(expense.amount) || 0,
      date: expense.date || new Date().toISOString().slice(0, 10)
    };
    data.expenses.unshift(newExp);
    this.saveAll(data);
    return data.expenses;
  },

  // Digital Bill Queue
  getDigitalBillQueue() {
    return this.getAll().digitalBillQueue || [];
  },

  processDigitalBillQueue() {
    const data = this.getAll();
    let updated = false;
    data.digitalBillQueue.forEach(item => {
      if (item.status === 'Pending') {
        item.status = 'Sent';
        item.sentAt = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) this.saveAll(data);
    return data.digitalBillQueue;
  },

  // Users & Staff Management
  getUsers() {
    return this.getAll().users || [];
  },

  saveUser(user) {
    const data = this.getAll();
    if (!data.users) data.users = [];
    const index = data.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      data.users[index] = { ...data.users[index], ...user };
    } else {
      const newUser = {
        ...user,
        id: user.id || `usr-${Date.now()}`,
        active: user.active !== false,
        pin: String(user.pin || '1234')
      };
      data.users.push(newUser);
    }
    this.saveAll(data);
    return data.users;
  },

  updateUserPin(userId, newPin) {
    const data = this.getAll();
    const user = data.users.find(u => u.id === userId);
    if (user) {
      user.pin = String(newPin);
      this.saveAll(data);
      return { success: true, user };
    }
    return { success: false, error: 'User not found' };
  },

  deleteUser(userId) {
    const data = this.getAll();
    const target = data.users.find(u => u.id === userId);
    if (target?.username === 'dhanush' || target?.isCreator) {
      throw new Error('Cannot delete the Developer / System Creator account (Dhanush).');
    }
    // Safety check: Don't allow deleting the last admin
    const admins = data.users.filter(u => u.role === 'admin');
    if (target?.role === 'admin' && admins.length <= 1) {
      throw new Error('Cannot delete the primary Administrator account.');
    }
    data.users = data.users.filter(u => u.id !== userId);
    this.saveAll(data);
    return data.users;
  },

  // Backup & Restore
  exportBackupJSON() {
    const data = this.getAll();
    return JSON.stringify(data, null, 2);
  },

  importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.products || !parsed.settings) {
        throw new Error('Invalid backup file format: missing required keys');
      }
      this.saveAll(parsed);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  resetToDefault() {
    this.saveAll(initialData);
    return initialData;
  }
};

// Web Audio API Synthesizer for high-speed cashier beep feedback
export const playSound = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Crisp checkout / scan beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'error') {
      // Low dual error tone
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'checkout') {
      // Cash register pleasant chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    // Gracefully ignore audio if browser blocks audio context without interaction
  }
};
