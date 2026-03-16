'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/utils/helpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const EMPTY = { name: '', amount: '', category: 'Vegetables', date: new Date().toISOString().split('T')[0], description: '', paymentMode: 'cash' };

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [editing, setEditing]   = useState(null);
  const [month, setMonth]       = useState(new Date().getMonth() + 1);
  const [year, setYear]         = useState(new Date().getFullYear());

  const load = () => {
    setLoading(true);
    axios.get('/expenses', { params: { month, year } })
      .then(({ data }) => setExpenses(data.expenses || []))
      .finally(() => setLoading(false));
  };

  useEffect(load, [month, year]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { data } = await axios.put(`/expenses/${editing}`, { ...form, amount: Number(form.amount) });
        setExpenses((p) => p.map((x) => x._id === editing ? data.expense : x));
        toast.success('Expense updated');
      } else {
        const { data } = await axios.post('/expenses', { ...form, amount: Number(form.amount) });
        setExpenses((p) => [data.expense, ...p]);
        toast.success('Expense added');
      }
      setShowForm(false); setEditing(null); setForm(EMPTY);
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this expense?')) return;
    await axios.delete(`/expenses/${id}`);
    setExpenses((p) => p.filter((x) => x._id !== id));
    toast.success('Deleted');
  };

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  // Category breakdown for chart
  const chartData = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    amount: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).filter((d) => d.amount > 0);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none">
            {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <TrendingDown size={14} /> Total: {formatCurrency(totalExpenses)}
          </div>
          <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold mb-4">By Category</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#E85D04" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No expenses this month</div>
          )}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/50">
                <tr>
                  {['Date', 'Name', 'Category', 'Amount', 'Mode', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Loading…</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No expenses this month</td></tr>
                ) : expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-accent/30">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 font-medium">{exp.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-accent px-2 py-0.5 rounded-full">{exp.category}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(exp.amount)}</td>
                    <td className="px-4 py-3 text-xs uppercase">{exp.paymentMode}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setForm({ ...exp, amount: String(exp.amount), date: exp.date?.split('T')[0] }); setEditing(exp._id); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => del(exp._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="font-bold text-lg mb-4">{editing ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={save} className="space-y-3">
              <input placeholder="Expense Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Amount ₹ *" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none">
                  {['cash','upi','bank','card'].map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </div>
              <textarea placeholder="Notes (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none resize-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
