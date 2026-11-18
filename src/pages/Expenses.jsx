import React, { useState } from 'react';
import { DollarSign, Plus, Calendar, Filter, Tag, Trash2, X } from 'lucide-react';

export default function Expenses({ expenses, onRecordExpense, settings }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const currency = settings.currency || 'Rs.';

  const categories = [
    'Electricity',
    'Rent & Utilities',
    'Transport & Logistics',
    'Staff Salaries & Meals',
    'Maintenance & Repairs',
    'Packaging & Bags',
    'Other Operational Expenses'
  ];

  const filteredExpenses = expenses.filter(e => 
    selectedCategory === 'all' || e.category === selectedCategory
  );

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-4 space-y-4">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-950/60 text-rose-400 border border-rose-800/40 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Daily Supermarket Operational Expenses</h3>
            <p className="text-[11px] text-slate-400">Track bills, transport, maintenance, and staff expenses for true P&L</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="all">All Expense Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Expense</span>
          </button>
        </div>
      </div>

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Expenses Recorded</span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-0.5">
              {currency} {totalExpenseSum.toLocaleString()}
            </div>
          </div>
          <div className="p-3 bg-rose-950/60 text-rose-400 rounded-xl border border-rose-800/50 font-bold">
            {filteredExpenses.length} Entries
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between col-span-2">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-semibold uppercase">Expense Categories Active</span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {categories.map(c => {
                const count = expenses.filter(e => e.category === c).length;
                if (count === 0) return null;
                return (
                  <span key={c} className="text-[11px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                    {c} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-700">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description / Reason</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 font-mono text-slate-300">
                    {exp.date}
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-rose-300 border border-slate-700">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">
                    {exp.notes || '—'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-rose-400 text-sm">
                    {currency} {Number(exp.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <AddExpenseModal
          categories={categories}
          currency={currency}
          onClose={() => setIsAddModalOpen(false)}
          onSave={(data) => {
            onRecordExpense(data);
            setIsAddModalOpen(false);
          }}
        />
      )}

    </div>
  );
}

function AddExpenseModal({ categories, currency, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category: categories[0],
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <h3 className="font-bold text-sm text-white">Record Supermarket Expense</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-slate-300 block mb-1">Expense Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Amount ({currency}) *</label>
            <input
              type="number"
              step="any"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono font-bold"
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
            />
          </div>

          <div>
            <label className="text-slate-300 block mb-1">Description / Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
              placeholder="e.g. Electricity bill payment"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded">
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
