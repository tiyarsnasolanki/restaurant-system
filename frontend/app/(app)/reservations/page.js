'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Phone, Calendar, Users } from 'lucide-react';
import { formatCurrency, formatDate } from '@/utils/helpers';

const EMPTY = { customerName: '', phone: '', eventDate: '', eventTime: '', numberOfGuests: '', eventType: 'catering', menuSelection: [], chargesPerPlate: '', advancePayment: '', venue: 'restaurant', specialRequests: '' };
const EVENT_TYPES = ['catering', 'party', 'corporate', 'wedding', 'birthday', 'other'];
const STATUS_COLORS = { pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700', completed: 'bg-blue-100 text-blue-700', cancelled: 'bg-red-100 text-red-700' };

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    axios.get('/reservations').then(({ data }) => setReservations(data.reservations || [])).finally(() => setLoading(false));
  }, []);

  const totalCharges = Number(form.numberOfGuests || 0) * Number(form.chargesPerPlate || 0);
  const balanceDue   = totalCharges - Number(form.advancePayment || 0);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const { data } = await axios.put(`/reservations/${editing}`, form);
        setReservations((p) => p.map((r) => r._id === editing ? data.reservation : r));
        toast.success('Updated!');
      } else {
        const { data } = await axios.post('/reservations', form);
        setReservations((p) => [data.reservation, ...p]);
        toast.success('Reservation added!');
      }
      setShowForm(false); setEditing(null); setForm(EMPTY);
    } catch { toast.error('Failed to save'); }
  };

  const del = async (id) => {
    if (!confirm('Delete reservation?')) return;
    await axios.delete(`/reservations/${id}`);
    setReservations((p) => p.filter((r) => r._id !== id));
    toast.success('Deleted');
  };

  const updateStatus = async (id, status) => {
    const { data } = await axios.put(`/reservations/${id}`, { status });
    setReservations((p) => p.map((r) => r._id === id ? data.reservation : r));
    toast.success(`Status → ${status}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{reservations.filter((r) => r.status !== 'cancelled').length} active reservations</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
          <Plus size={16} /> New Reservation
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reservations.map((r) => (
            <div key={r._id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{r.customerName}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <Phone size={11} /> {r.phone}
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar size={13} />
                  <span>{formatDate(r.eventDate)} {r.eventTime && `@ ${r.eventTime}`}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users size={13} />
                  <span>{r.numberOfGuests} guests · {r.eventType}</span>
                </div>
              </div>
              <div className="bg-accent/50 rounded-xl p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Charges/plate</span>
                  <span className="font-medium">{formatCurrency(r.chargesPerPlate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatCurrency(r.totalCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Advance</span>
                  <span className="text-green-600 font-medium">-{formatCurrency(r.advancePayment)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="font-semibold">Balance Due</span>
                  <span className="font-bold text-orange-600">{formatCurrency(r.balanceDue)}</span>
                </div>
              </div>
              {r.specialRequests && <p className="text-xs text-muted-foreground italic">"{r.specialRequests}"</p>}
              <div className="flex gap-2">
                {r.status === 'pending' && (
                  <button onClick={() => updateStatus(r._id, 'confirmed')} className="flex-1 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold">Confirm</button>
                )}
                {r.status === 'confirmed' && (
                  <button onClick={() => updateStatus(r._id, 'completed')} className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold">Complete</button>
                )}
                <button onClick={() => { setForm({ ...r, eventDate: r.eventDate?.split('T')[0], menuSelection: r.menuSelection || [] }); setEditing(r._id); setShowForm(true); }}
                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-500">
                  <Pencil size={14} />
                </button>
                <button onClick={() => del(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {reservations.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              <Calendar size={48} className="mx-auto mb-3 opacity-20" />
              <p>No reservations yet</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in my-4">
            <h2 className="font-bold text-lg mb-4">{editing ? 'Edit Reservation' : 'New Reservation'}</h2>
            <form onSubmit={save} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Customer Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                <input placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
                <input type="time" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="No. of Guests *" value={form.numberOfGuests} onChange={(e) => setForm({ ...form, numberOfGuests: e.target.value })} required min="1"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none capitalize">
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Charges/Plate ₹ *" value={form.chargesPerPlate} onChange={(e) => setForm({ ...form, chargesPerPlate: e.target.value })} required min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                <input type="number" placeholder="Advance ₹" value={form.advancePayment} onChange={(e) => setForm({ ...form, advancePayment: e.target.value })} min="0"
                  className="px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none" />
              </div>
              {/* Auto-calc preview */}
              {form.numberOfGuests && form.chargesPerPlate && (
                <div className="bg-orange-50 dark:bg-orange-950/20 rounded-xl p-3 text-sm flex justify-between">
                  <span>Total: <strong>{formatCurrency(totalCharges)}</strong></span>
                  <span>Balance: <strong className="text-orange-600">{formatCurrency(Math.max(0, balanceDue))}</strong></span>
                </div>
              )}
              <textarea placeholder="Special Requests" value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} rows={2}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none resize-none" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold">{editing ? 'Update' : 'Book'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
