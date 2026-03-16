'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { QrCode, Download, ExternalLink } from 'lucide-react';

export default function QRMenuPage() {
  const [menu, setMenu]   = useState({});
  const [loading, setLoading] = useState(true);
  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/qr-display` : '';

  useEffect(() => {
    axios.get('/menu').then(({ data }) => setMenu(data.menu || {})).finally(() => setLoading(false));
  }, []);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(menuUrl)}`;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* QR Code */}
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <QrCode className="text-orange-500" size={24} />
          <h2 className="text-xl font-bold">QR Menu for Customers</h2>
        </div>
        <div className="inline-block bg-white p-4 rounded-2xl shadow-lg mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR Menu" width={250} height={250} className="rounded-xl" />
        </div>
        <p className="text-sm text-muted-foreground mb-4">Customers scan this QR to view the menu</p>
        <p className="text-xs text-muted-foreground font-mono bg-accent px-3 py-1.5 rounded-lg inline-block">{menuUrl}</p>
        <div className="flex justify-center gap-3 mt-4">
          <a href={qrUrl} download="jk-dosa-qr-menu.png"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
            <Download size={16} /> Download QR
          </a>
          <a href="/qr-display" target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-xl text-sm font-semibold transition-all">
            <ExternalLink size={16} /> Preview Menu
          </a>
        </div>
      </div>

      {/* Menu Preview */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-bold">Menu Preview</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{Object.values(menu).flat().length} items visible to customers</p>
        </div>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">Loading…</div>
        ) : (
          Object.entries(menu).map(([cat, items]) => (
            <div key={cat}>
              <div className="px-5 py-2.5 bg-accent/30 border-y border-border">
                <h4 className="font-semibold text-sm text-orange-600">{cat}</h4>
              </div>
              {items.map((item) => (
                <div key={item._id} className="flex items-center justify-between px-5 py-3 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-sm">₹{item.price}</span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
