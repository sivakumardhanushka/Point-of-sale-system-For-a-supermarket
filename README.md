# SuperMarket Desktop POS & Management System

A high-speed, desktop-based Point of Sale (POS) and Supermarket Management System designed for Windows computers. Operates 100% offline-first with zero dependence on continuous internet connectivity.

---

## 👥 Separated Roles: Cashier vs Administrator

The system enforces role-based access control with a dedicated **Register Lock Screen** and **Supervisor PIN Override**:

### 1. 🛒 Cashier Role
- **Focused Billing Interface**: Primary access to the high-speed barcode checkout terminal.
- **Permitted Operations**:
  - Scanning barcodes & fast item searching
  - Quantity adjustments & line item discounts
  - Hold / Park active bills and resume them
  - Process cash, card, and QR/UPI payments with automatic change calculation
  - Print 80mm/58mm thermal receipts & dispatch digital bills to customer mobile
  - Customer loyalty lookup
  - End-of-shift Z-close / cash-in-drawer reconciliation
- **Restricted from**: Product pricing edits, inventory adjustments, purchase orders, expenses, full P&L reports, and system settings.
- **Supervisor Override**: If a cashier clicks a restricted module (like Inventory or Expenses), the app prompts for a **Supervisor PIN** to authorize the action.

### 2. 🛡️ Administrator / Store Manager Role
- **Full Operational Authority**:
  - Product Catalog (Add, Edit, Delete, Stock count adjustments, CSV import/export)
  - Purchasing & Inward Supplier Orders (automatic stock increments)
  - Daily Supermarket Expenses Tracking (Rent, Electricity, Salaries, Transport)
  - Executive Business Analytics & Profit / Loss (P&L) Reports
  - System Branding, Thermal Printer roll width configuration, and Tax rates
  - 100% Offline Local Database Backup & Restore
  - Staff User & Cashier Management

---

## 🔑 Default Staff PINs (Demo Accounts)

| Role | Name | Username | PIN |
| --- | --- | --- | --- |
| **Administrator** | Store Administrator | `admin` | **`1234`** |
| **Manager** | Sunil Wickrama | `manager` | **`5678`** |
| **Cashier 01** | Priya Fernando | `cashier1` | **`1111`** |
| **Cashier 02** | Kamal Jayawardena | `cashier2` | **`2222`** |

> To switch staff or lock the terminal, click the **"Lock (Logout)"** button in the top right corner.

---

## 🚀 How to Run

### Option 1: 1-Click Windows Executable (.EXE)
Just double click:
👉 **`Supermarket-POS.exe`** (or **`Supermarket POS.lnk`** on your Windows Desktop)

*(No command prompt needed! It automatically launches the desktop POS app).*

### Option 2: Standalone Desktop Window (Electron CLI)
```powershell
npm run desktop
```

### Option 3: Browser / Multi-Terminal Local Network (LAN)
```powershell
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

---

## ⌨ Cashier Keyboard Shortcuts

| Key | Action |
| --- | --- |
| **F1** | POS Billing Terminal |
| **F2** | Inventory & Stock Alerts (Admin/Manager) |
| **F3** | Purchasing & Supplier Orders (Admin/Manager) |
| **F4** | Customers & Loyalty CRM |
| **F5** | Operational Expenses (Admin) |
| **F6** | Reports / Cashier Shift Z-Report |
| **F7** | Customer Mobile Digital Bill Queue |
| **F8** | System Settings & Backup (Admin) |
| **F9 / Space** | Open Checkout & Payment Modal |
| **F10** | Park / Hold Active Customer Cart |
| **F11** | View Held Carts List |
| **F12** | Return / Refund Dialog |
| **Esc** | Close Active Modal / Clear |
| **Enter** | Submit Barcode / Confirm Payment |
