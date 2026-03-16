'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Trash2, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { formatDate } from '@/utils/helpers';

const EMPTY = { name: '', email: '', password: '', phone: '', role: 'staff' };

export default function StaffPage() {
  const [staff, setStaff]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY);

  useEffect(() => {
    axios.get('/staff').then(({ data }) => setStaff(data.staff || [])).finally(() => setLoading(false));
  }, []);

  const addStaff = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/auth/register', form);
      const { data } = await axios.get('/staff');
      setStaff(data.staff || []);
      toast.success('Staff added!');
      setShowForm(false); setForm(EMPTY);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add');
    }
  };

  const toggle = async (id) => {
    const { data } = await axios.patch(`/staff/${id}/toggle`);
    setStaff((p) => p.map((s) => s._id === id ? { ...s, isActive: data.user.isActive } : s));
    toast(data.user.isActive ? '✅ Activated' : '⛔ Deactivated');
  };

  const del = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    await axios.delete(`/staff/${id}`);
    setStaff((p) => p.filter((s) => s._id !== id));
    toast.success('Removed');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">{staff.filter((s) => s.isActive).length} active · {staff.length} total staff</div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">Loading…</div>
        ) : staff.length === 0 ? (
          <div className="col-span-full text-center py-20 text-muted-foreground">
            <Users size={48} className="mx-auto mb-3 opacity-20" />
            <p>No staff members added</p>
          </div>
        ) : staff.map((s) => (
          <div key={s._id} className={`bg-card border rounded-2xl p-5 ${s.isActive ? 'border-border' : 'border-red-200 dark:border-red-900 opacity-60'}`}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center text-white text-lg font-black flex-shrink-0">
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div>
                <span className="text-xs bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium capitalize">
                  {s.role}
                </span>
                <p className="text-xs text-muted-foreground mt-1">Joined {formatDate(s.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(s._id)} className="transition-colors" title="Toggle active">
                  {s.isActive ? <ToggleRight size={24} className="text-green-500" /> : <ToggleLeft size={24} className="text-gray-400" />}
                </button>
                <button onClick={() => del(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="font-bold text-lg mb-4">Add Staff Member</h2>
            <form onSubmit={addStaff} className="space-y-3">
              <input placeholder="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none">
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold">Add Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
