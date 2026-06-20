import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Package, Search, Truck, CheckCircle2, MapPin, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getOrderDirect } from '../services/wordpress';
import { useAuth } from '../context/AuthContext';

const TrackOrder: React.FC = () => {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const [searchParams] = useSearchParams();
  
  // States
  const [orderId, setOrderId] = useState(searchParams.get('order_id') || '');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [orderData, setOrderData] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // SANITIZER: Clean "TM-51-51" into "51"
    const cleanId = orderId.replace(/TM-/gi, '').split('-')[0].trim();
    if (!cleanId || !email) return;

    setStatus('searching');
    try {
      const data = await getOrderDirect(cleanId, email);
      
      // Check if data exists and isn't a WordPress error object
      if (data && data.id) {
        setOrderData(data);
        setStatus('found');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error("Tracking Error:", err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-12 py-20 min-h-screen">
      <div className="max-w-3xl mx-auto">
        
        {/* 1. SEARCH FORM */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-black tracking-tight mb-4">Track Order</h1>
          <p className="text-on-surface/40 font-medium">Enter your details to see real-time updates.</p>
        </div>

        <motion.div layout className="bg-surface-container-low p-8 rounded-[2.5rem] border border-outline-variant/5 shadow-sm mb-10">
          <form onSubmit={handleTrack} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 px-2">Order ID</label>
              <input
                type="text" required placeholder="TM-00-00" value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-white px-6 py-4 rounded-2xl outline-none border border-outline-variant/10 font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/30 px-2">Email</label>
              <input
                type="email" required placeholder="your@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white px-6 py-4 rounded-2xl outline-none border border-outline-variant/10 font-bold"
              />
            </div>
            <button
              disabled={status === 'searching'}
              className="md:col-span-2 mt-2 bg-primary text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              {status === 'searching' ? <Loader2 className="animate-spin" /> : <><Search size={20} /> Track Package</>}
            </button>
          </form>
        </motion.div>

        {/* 2. RESULTS */}
        <AnimatePresence mode="wait">
          {status === 'error' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 bg-red-50 rounded-2xl text-red-600 flex gap-4">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">No order found with those details.</p>
            </motion.div>
          )}

          {status === 'found' && orderData && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* GLOBAL TRACKING ID CARD */}
              <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-xl shadow-primary/20 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Global Tracking ID</p>
                  <h2 className="text-3xl font-display font-black italic tracking-tight">
                    {/* Shows the custom ID or generates one from the real DB ID */}
                    {orderData.tracking_id || `TM-${orderData.id}-${orderData.number}`}
                  </h2>
                </div>
                <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Status</p>
                  <p className="font-bold text-sm uppercase">{orderData.status}</p>
                </div>
              </div>

              {/* DYNAMIC ADDRESS & SUMMARY (Hidden for Guests) */}
              {isLoggedIn ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* REAL ADDRESS DATA */}
                  <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/5">
                    <h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-3 flex items-center gap-2"><MapPin size={12} /> Shipping To</h4>
                    <p className="font-bold text-sm">
                      {orderData.shipping?.first_name || orderData.billing?.first_name} {orderData.shipping?.last_name || orderData.billing?.last_name}
                    </p>
                    <p className="text-xs text-on-surface/50">
                      {orderData.shipping?.address_1 || orderData.billing?.address_1}, {orderData.shipping?.city || orderData.billing?.city}
                    </p>
                  </div>

                  {/* REAL ITEM SUMMARY */}
                  <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/5">
                    <h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest mb-3 flex items-center gap-2"><Package size={12} /> Items</h4>
                    {orderData.line_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-on-surface/60">{item.quantity}x {item.name}</span>
                        <span className="text-primary">Rs. {parseFloat(item.total).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t border-outline-variant/10 mt-3 pt-2 flex justify-between text-sm font-black">
                      <span>Total</span>
                      <span>Rs. {parseFloat(orderData.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 flex items-center justify-between">
                  <p className="text-xs font-bold text-primary">Login to view delivery address and items.</p>
                  <Link to="/account" className="p-3 bg-primary text-white rounded-xl"><ChevronRight size={18} /></Link>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TrackOrder;