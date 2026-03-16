'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { MENU_CATEGORIES } from '@/utils/helpers';

const EMPTY_FORM = { name: '', category: 'Paper Dosa', price: '', description: '', isVeg: true, preparationTime: 5, isAvailable: true };

export default function MenuPage() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [search, setSearch]   = useState('');
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    axios.get('/menu/all').then(({ data }) => setItems(data.items || [])).finally(() => setLoading(false));
  }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditing(null); setShowForm(true); };
  const openEdit = (item) => { setForm({ ...item, price: String(item.price) }); setEditing(item._id); setShowForm(true); };

  const saveItem = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { data } = await axios.put(`/menu/${editing}`, { ...form, price: Number(form.price) });
        setItems((p) => p.map((i) => i._id === editing ? data.item : i));
        toast.success('Item updated!');
      } else {
        const { data } = await axios.post('/menu', { ...form, price: Number(form.price) });
        setItems((p) => [...p, data.item]);
        toast.success('Item added!');
      }
      setShowForm(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
    }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    await axios.delete(`/menu/${id}`);
    setItems((p) => p.filter((i) => i._id !== id));
    toast.success('Deleted');
  };

  const toggleAvailability = async (item) => {
    const { data } = await axios.put(`/menu/${item._id}`, { ...item, isAvailable: !item.isAvailable });
    setItems((p) => p.map((i) => i._id === item._id ? data.item : i));
  };

  const categories = ['All', ...MENU_CATEGORIES];
  const filtered = items.filter((i) => {
    const matchCat = filterCat === 'All' || i.category === filterCat;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const grouped = MENU_CATEGORIES.reduce((acc, cat) => {
    const catItems = filtered.filter((i) => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterCat === c ? 'bg-orange-500 text-white' : 'bg-card border border-border text-muted-foreground hover:bg-accent'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Items by category */}
      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading menu…</div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) => (
          <div key={cat} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-orange-50 dark:bg-orange-950/20 border-b border-border">
              <h2 className="font-bold text-orange-700 dark:text-orange-400">{cat} <span className="text-sm font-normal text-muted-foreground">({catItems.length})</span></h2>
            </div>
            <div className="divide-y divide-border">
              {catItems.map((item) => (
                <div key={item._id} className={`flex items-center gap-4 px-5 py-3 ${!item.isAvailable ? 'opacity-50' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="font-semibold text-foreground">{item.name}</span>
                      {!item.isAvailable && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>}
                    </div>
                    {item.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-foreground">₹{item.price}</span>
                    <p className="text-xs text-muted-foreground">{item.preparationTime} min</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => toggleAvailability(item)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Toggle">
                      {item.isAvailable ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-gray-400" />}
                    </button>
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteItem(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="font-bold text-lg mb-4">{editing ? 'Edit Item' : 'Add Menu Item'}</h2>
            <form onSubmit={saveItem} className="space-y-3">
              <input placeholder="Item Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none">
                  {MENU_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" placeholder="Price ₹ *" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none resize-none" />
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="accent-green-500" />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="accent-orange-500" />
                  <span className="text-sm">Available</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Prep:</span>
                  <input type="number" value={form.preparationTime} onChange={(e) => setForm({ ...form, preparationTime: Number(e.target.value) })} min="1" max="60"
                    className="w-16 px-2 py-1 bg-background border border-border rounded-lg text-sm focus:outline-none" />
                  <span className="text-sm text-muted-foreground">min</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors">
                  {editing ? 'Update' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
