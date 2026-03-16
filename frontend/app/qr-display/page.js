'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function QRDisplayPage() {
  const [menu, setMenu] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    axios.get(`${API}/menu`).then(({ data }) => setMenu(data.menu || {})).finally(() => setLoading(false));
  }, []);

  const categories = ['All', ...Object.keys(menu)];
  const allItems = Object.values(menu).flat();
  const displayed = activeCategory === 'All' ? allItems : (menu[activeCategory] || []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-950 to-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 bg-orange-950/95 backdrop-blur-sm border-b border-orange-900 z-10">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-black text-sm">JK</div>
            <div>
              <h1 className="font-bold text-lg leading-tight">JK Spicy Dosa Cafe</h1>
              <p className="text-xs text-orange-300">Fresh & Authentic Dosas</p>
            </div>
          </div>
          {/* Category scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                  ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-lg mx-auto px-4 py-4 pb-16">
        {loading ? (
          <div className="text-center py-20 text-orange-300">Loading menu…</div>
        ) : (
          <div className="space-y-2">
            {displayed.map((item) => (
              <div key={item._id} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.isVeg ? 'bg-green-400' : 'bg-red-400'}`} />
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    {item.description && <p className="text-xs text-white/50">{item.description}</p>}
                  </div>
                </div>
                <span className="text-orange-400 font-bold text-sm flex-shrink-0 ml-3">₹{item.price}</span>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-8 text-white/30 text-xs">
          <p>We use Amul Cheese & Butter</p>
          <p className="mt-1">📍 Please ask staff to place your order</p>
        </div>
      </div>
    </div>
  );
}
