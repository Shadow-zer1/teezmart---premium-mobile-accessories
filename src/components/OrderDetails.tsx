import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Package, Loader2, MapPin, Mail, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { getOrderDirect } from '../services/wordpress';

const OrderDetails = ({ order, onClose, onRefresh }: any) => {
  const [cancelling, setCancelling] = useState(false);

  // --- TRACKING LOGIC MOVED INSIDE ---
  const [isTracking, setIsTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);

  const handleQuickTrack = async () => {
    console.log("Button Clicked! Tracking for ID:", order.id); // <--- Add this!
    setIsTracking(true);
    try {
      const data = await getOrderDirect(order.id, order.billing.email);
      console.log("Data received:", data);
      setTrackingData(data);
    } catch (err) {
      console.error("Quick track failed", err);
    } finally {
      setIsTracking(false);
    }
  };
  // ----------------------------------

  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancelling(true);
    try {
      const { updateOrderStatus } = await import('../services/wordpress');
      await updateOrderStatus(order.id, 'cancelled');
      onRefresh();
      onClose();
    } catch (err) {
      alert("Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-50 text-green-600 border-green-100';
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'on-hold': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-primary/5 text-primary border-primary/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-100 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }}
        className="bg-surface-container-lowest rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-outline-variant/10 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-display font-black">Order #{order.number}</h2>
              <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getStatusStyles(order.status))}>
                {order.status}
              </div>
            </div>
            <p className="text-on-surface/40 font-bold text-sm">Placed on {new Date(order.date_created).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
          </div>
          <button className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-all" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">

          {/* TRACKING SECTION */}
          <div className="bg-surface-container-low rounded-3xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-bold text-lg">Tracking Information</h3>
              {order.shipping_lines?.[0]?.method_title && (
                <span className="text-xs font-bold text-primary uppercase">{order.shipping_lines[0].method_title}</span>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-on-surface/30 uppercase tracking-tighter">Global Tracking ID</p>
                  <p className="font-mono font-bold text-primary">
                    {order.meta_data?.find((m: any) => m.key === '_tracking_number')?.value || `TM-${order.id}-${order.number}`}
                  </p>
                </div>
                <button
                  onClick={handleQuickTrack}
                  disabled={isTracking}
                  className="px-6 py-3 bg-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 border border-outline-variant/5"
                >
                  {isTracking ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                  {trackingData ? "Refresh Status" : "Track Shipment"}
                </button>
              </div>

              {/* TIMELINE UI (Shows up after clicking Track) */}
              {trackingData && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-6 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center relative px-2">
                    <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-outline-variant/10 -z-0" />
                    {['pending', 'processing', 'completed'].map((step, idx) => {
                      const currentStatus = trackingData.status?.toLowerCase() || 'pending';
                      const currentIdx = ['pending', 'processing', 'completed'].indexOf(currentStatus);
                      const isActive = currentIdx >= idx;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 relative z-10 bg-surface-container-low px-2">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-700",
                            isActive ? "bg-primary border-primary/20 text-white shadow-lg shadow-primary/20" : "bg-white border-outline-variant/10 text-on-surface/10"
                          )}>
                            {isActive ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold opacity-30">{idx + 1}</span>}
                          </div>
                          <p className={cn("text-[8px] font-black uppercase tracking-widest", isActive ? "text-primary" : "text-on-surface/20")}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Rest of your existing Address, Items, and Totals sections... */}
          {/* (Kept your existing logic below) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={12} /> Shipping Address
              </h4>
              <div className="text-sm font-medium leading-relaxed">
                <p className="font-bold text-on-surface">{order.shipping.first_name} {order.shipping.last_name}</p>
                <p className="text-on-surface/60">{order.shipping.address_1}</p>
                <p className="text-on-surface/60">{order.shipping.city}, {order.shipping.state} {order.shipping.postcode}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest flex items-center gap-2">
                <Mail size={12} /> Payment Method
              </h4>
              <div className="text-sm font-medium">
                <p className="font-bold text-on-surface uppercase">{order.payment_method_title}</p>
                <p className="text-on-surface/60 text-xs">Transaction ID: {order.transaction_id || 'Internal Processing'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-on-surface/30 uppercase tracking-widest px-2">Order Items</h4>
            <div className="space-y-3">
              {order.line_items.map((item: any) => (
                <Link
                  key={item.id}
                  to={`/product/${item.name.toLowerCase().replace(/ /g, '-')}`}
                  className="flex items-center justify-between p-3 bg-surface-container-low rounded-2xl group hover:bg-primary/5 transition-all border border-transparent hover:border-primary/10"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl overflow-hidden border border-outline-variant/10 shrink-0">
                      {item.image?.src ? (
                        <img src={item.image.src} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/20"><Package size={24} /></div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{item.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">Qty: {item.quantity}</span>
                        <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-tighter">SKU: {item.sku || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <p className="font-display font-bold text-sm">Rs. {parseFloat(item.total).toLocaleString()}</p>
                    <ChevronRight size={14} className="text-on-surface/20 group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 rounded-[2rem] p-8 space-y-3">
            <div className="flex justify-between text-sm font-bold text-on-surface/60">
              <span>Subtotal</span>
              <span>Rs. {(parseFloat(order.total) - parseFloat(order.shipping_total)).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-on-surface/60">
              <span>Shipping cost</span>
              <span>Rs. {parseFloat(order.shipping_total).toLocaleString()}</span>
            </div>
            <div className="pt-4 border-t border-primary/10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Grand Total</p>
                <p className="text-4xl font-display font-black text-primary">Rs. {parseFloat(order.total).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-surface-container-low flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 bg-white rounded-2xl font-bold hover:bg-on-surface hover:text-white transition-all shadow-sm">
            Close
          </button>
          {['pending', 'on-hold'].includes(order.status.toLowerCase()) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100"
            >
              {cancelling ? <Loader2 size={18} className="animate-spin" /> : "Cancel Order"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderDetails;