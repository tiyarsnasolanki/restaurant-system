'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, AlertTriangle, PackagePlus } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';

const INVENTORY_CATEGORIES = ['Vegetables', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Packaging', 'Other'];
const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'packet', 'dozen'];
const EMPTY = { name: '', category: 'Vegetables', currentStock: '', unit: 'kg', minimumStock: '1', costPerUnit: '', supplier: '' };

export default function InventoryPage() {
  const [items, setItems]     = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRestock, setShowRestock] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    axios.get('/inventory').then(({ data }) => { setItems(data.items || []); setLowStock(data.lowStock || []); }).finally(() => setLoading(false));
  }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, currentStock: Number(form.currentStock), minimumStock: Number(form.minimumStock), costPerUnit: Number(form.costPerUnit) };
      if (editing) {
        const { data } = await axios.put(`/inventory/${editing}`, payload);
        setItems((p) => p.map((i) => i._id === editing ? data.item : i));
        toast.success('Updated!');
      } else {
        const { data } = await axios.post('/inventory', payload);
        setItems((p) => [...p, data.item]);
        toast.success('Item added!');
      }
      setShowForm(false); setEditing(null); setForm(EMPTY);
    } catch { toast.error('Failed'); }
  };

  const restock = async (id) => {
    if (!restockQty) return;
    const { data } = await axios.put(`/inventory/${id}`, { addStock: Number(restockQty) });
    setItems((p) => p.map((i) => i._id === id ? data.item : i));
    setLowStock((p) => p.filter((i) => i._id !== id || data.item.currentStock > data.item.minimumStock));
    setShowRestock(null); setRestockQty('');
    toast.success('Stock updated!');
  };

  const filtered = items.filter((i) => filterCat === 'All' || i.category === filterCat);

  return (
    <div className="space-y-4">
      {/* Low Stock Alert Banner */}
      {lowStock.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <h3 className="font-semibold text-amber-800 dark:text-amber-300">Low Stock Alert ({lowStock.length} items)</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item) => (
              <div key={item._id} className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs">
                <span className="font-semibold">{item.name}</span>
                <span className="opacity-70">{item.currentStock} {item.unit} left</span>
                <button onClick={() => { setShowRestock(item._id); setRestockQty(''); }}
                  className="bg-amber-600 text-white px-2 py-0.5 rounded-md font-semibold hover:bg-amber-700">
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {['All', ...INVENTORY_CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === c ? 'bg-orange-500 text-white' : 'bg-card border border-border text-muted-foreground hover:bg-accent'}`}>
              {c}
            </button>
          ))}
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50">
              <tr>{['Item', 'Category', 'Stock', 'Min Stock', 'Unit Cost', 'Status', 'Last Restocked', 'Actions'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Loading…</td></tr>
              ) : filtered.map((item) => {
                const isLow = item.currentStock <= item.minimumStock;
                return (
                  <tr key={item._id} className={`hover:bg-accent/30 ${isLow ? 'bg-red-50/30 dark:bg-red-950/10' : ''}`}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-xs"><span className="bg-accent px-2 py-0.5 rounded-full">{item.category}</span></td>
                    <td className={`px-4 py-3 font-bold ${isLow ? 'text-red-600' : 'text-foreground'}`}>
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.minimumStock} {item.unit}</td>
                    <td className="px-4 py-3">{item.costPerUnit ? formatCurrency(item.costPerUnit) : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isLow ? '⚠️ Low' : '✅ OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.lastRestocked ? formatDate(item.lastRestocked) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setShowRestock(item._id); setRestockQty(''); }}
                          className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/30 text-green-600" title="Restock">
                          <PackagePlus size={14} />
                        </button>
                        <button onClick={() => { setForm({ ...item, currentStock: String(item.currentStock), minimumStock: String(item.minimumStock), costPerUnit: String(item.costPerUnit || '') }); setEditing(item._id); setShowForm(true); }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="font-bold text-lg mb-4">{editing ? 'Edit Item' : 'Add Inventory Item'}</h2>
            <form onSubmit={save} className="space-y-3">
              <input placeholder="Item Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none">
                  {INVENTORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Current Stock *" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} required min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                <input type="number" placeholder="Min Stock *" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: e.target.value })} required min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Cost/Unit ₹" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
                <input placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold">{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><PackagePlus className="text-green-500" size={20} /> Add Stock</h2>
            <div className="space-y-3">
              <input type="number" placeholder="Quantity to add" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} autoFocus min="0"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <div className="flex gap-2">
                <button onClick={() => setShowRestock(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">Cancel</button>
                <button onClick={() => restock(showRestock)} className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-bold">Add Stock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
