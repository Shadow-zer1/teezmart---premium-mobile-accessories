import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { validateCoupon } from '../services/wordpress';
import { useAuth } from '../context/AuthContext';

const formatPKR = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatAttributeLabel = (label: string): string =>
  label
    .replace(/^pa_/, '')
    .replace(/^#\s*/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const Cart: React.FC = () => {
  const getDisplayLabel = (val: any): string => {
    if (!val) return "";
    if (typeof val === 'string') return val;
    // If it's an object, pick the first value (e.g., "Space Gray" or "100W")
    return Object.values(val)[0] as string || "Standard";
  };
  const { cart, cartTotal, cartCount, removeFromCart, updateQuantity, settings } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const { shippingThreshold, flatRateCost, taxRate, isTaxEnabled, isCouponsEnabled } = settings;

  const taxAmount = isTaxEnabled ? (cartTotal * taxRate) : 0;
  const shippingCost = cartTotal >= shippingThreshold ? 0 : flatRateCost;

  const discountAmount = (() => {
    if (!appliedCoupon) return 0;
    const amt = parseFloat(appliedCoupon.amount);
    return appliedCoupon.discount_type === 'percent' ? (cartTotal * amt) / 100 : amt;
  })();

  const grandTotal = cartTotal + taxAmount + shippingCost - discountAmount;

  const handleApplyCoupon = async () => {
    if (!promoCodeInput) return;
    setIsApplying(true);
    setCouponError(null);

    try {
      const res = await validateCoupon(promoCodeInput);

      if (res.success && res.data) {
        const coupon = res.data;
        if (coupon.minimum_amount && cartTotal < parseFloat(coupon.minimum_amount)) {
          setCouponError(`Add Rs. ${formatPKR(parseFloat(coupon.minimum_amount) - cartTotal)} more to use this code (Min. spend: Rs. ${formatPKR(coupon.minimum_amount)})`);
          setAppliedCoupon(null);
        } else if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
          setCouponError("This code has reached its maximum usage limit.");
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
          setPromoCodeInput('');
        }
      } else {
        setCouponError("Invalid promo code. Please check for typos.");
      }
    } catch (err) {
      setCouponError("Failed to validate coupon.");
    } finally {
      setIsApplying(false);
    }
  };
  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-32 h-32 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-10 shadow-ambient">
            <ShoppingBag size={56} className="text-primary/20" />
          </div>
          <h1 className="text-5xl font-display font-extrabold tracking-tight mb-6">Your atrium is empty</h1>
          <p className="text-on-surface/40 font-medium mb-12 leading-relaxed">Looks like you haven't added any premium accessories to your collection yet. Explore our curated shop to find the perfect match.</p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-3 px-12 py-5 text-lg">
            Start Shopping <ArrowRight size={24} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
      <div className="mb-16">
        <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-3 block">Your Selection</span>
        <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight">Shopping Cart ({cartCount})</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-10">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div
                key={item.cartItemId || `${item.id}-${getDisplayLabel(item.selectedColor)}-${getDisplayLabel(item.selectedModel)}`}
                layout
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="flex flex-col sm:flex-row gap-10 p-10 bg-surface-container-low rounded-2xl hover:bg-white hover:shadow-ambient transition-all duration-500 group"
              >
                {/* Product Image */}
                <div className="w-full sm:w-40 aspect-square bg-white rounded-3xl overflow-hidden shrink-0 shadow-sm group-hover:shadow-ambient transition-all duration-500">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <Link to={`/product/${item.id}`} className="font-display font-extrabold text-2xl tracking-tight hover:text-primary transition-colors">
                        {item.name}
                      </Link>
                      <button
                        onClick={() => removeFromCart(item.cartItemId || '')}
                        className="p-3 text-on-surface/20 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-300"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30 mb-6">
                      <span>Specs:</span>

                      {/* If we have the dynamic attributes, show them all separated by dots */}
                      {item.allAttributes ? (
                        Object.entries(item.allAttributes).map(([key, val], index, array) => (
                          <React.Fragment key={key}>
                            <span className="text-on-surface">
                              {formatAttributeLabel(key)}: {getDisplayLabel(val)}
                            </span>
                            {index < array.length - 1 && <span className="opacity-30">•</span>}
                          </React.Fragment>
                        ))
                      ) : (
                        /* Fallback for old items already in cart */
                        <>
                          <span className="text-on-surface">{getDisplayLabel(item.selectedColor)}</span>
                          {item.selectedModel && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-on-surface">{getDisplayLabel(item.selectedModel)}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex items-center bg-white/50 backdrop-blur-sm rounded-xl p-1.5 shadow-sm">
                      <button
                        onClick={() => updateQuantity(item.cartItemId || '', item.quantity - 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white hover:text-primary rounded-lg transition-all duration-300 text-on-surface/40"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-12 text-center font-display font-extrabold text-lg">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartItemId || '', item.quantity + 1)}
                        className="w-12 h-12 flex items-center justify-center hover:bg-white hover:text-primary rounded-lg transition-all duration-300 text-on-surface/40"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-label font-bold text-on-surface/20 tracking-widest uppercase mb-1">Total Price</span>
                      <span className="text-2xl font-display font-extrabold text-primary">Rs. {formatPKR(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Continue Shopping */}
          <Link to="/shop" className="inline-flex items-center gap-3 text-sm font-bold text-primary hover:gap-5 transition-all duration-300">
            <ArrowRight size={18} className="rotate-180" /> Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="space-y-10">
          <div className="bg-surface-container-low rounded-2xl p-10 sticky top-28 shadow-sm">
            <h2 className="text-2xl font-display font-extrabold mb-10 tracking-tight">Order Summary</h2>

            <div className="space-y-6 mb-10">
              {/* Subtotal */}
              <div className="flex justify-between text-sm font-medium">
                <span className="text-on-surface/40">Subtotal</span>
                <span className="font-bold">Rs. {formatPKR(cartTotal)}</span>
              </div>

              {/* Dynamic Tax (17% GST) */}
              {isTaxEnabled && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-on-surface/40">Estimated Tax</span>
                  <span className="font-bold">Rs. {formatPKR(taxAmount)}</span>
                </div>
              )}

              {/* Dynamic Shipping */}
              <div className="flex justify-between text-sm font-medium">
                <span className="text-on-surface/40">Shipping</span>
                <span className={cn("font-bold", cartTotal >= shippingThreshold ? "text-primary" : "text-on-surface/40")}>
                  {cartTotal >= shippingThreshold ? "FREE" : `Rs. ${formatPKR(shippingCost)}`}
                </span>
              </div>

              {/* ✅ NEW: Discount Row (Shows only when coupon is applied) */}
              <AnimatePresence>
                {appliedCoupon && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between text-sm font-bold text-green-600 py-2 border-t border-dashed border-green-100"
                  >
                    <div className="flex items-center gap-2">
                      <span>Discount ({appliedCoupon.code})</span>
                      <button
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[9px] underline uppercase tracking-widest text-red-400 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <span>- Rs. {formatPKR(discountAmount)}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Final Total */}
              <div className="pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                <span className="text-xl font-display font-extrabold">Total</span>
                <span className="text-3xl font-display font-extrabold text-primary">
                  Rs. {formatPKR(grandTotal)}
                </span>
              </div>
            </div>



            <button
              onClick={() => navigate('/checkout', {
                state: {
                  appliedCoupon: appliedCoupon, // Send the coupon object
                  initialDiscount: discountAmount // Send the calculated discount
                }
              })}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3 mb-6"
            >
              Checkout Now
              <ArrowRight size={24} />
            </button>

            <div className="space-y-5 pt-8 border-t border-outline-variant/10">
              <div className="flex items-center gap-4 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                <ShieldCheck size={18} className="text-primary/40" />
                Secure Checkout Guaranteed
              </div>
              <div className="flex items-center gap-4 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                <Truck size={18} className="text-primary/40" />
                Free Express Delivery
              </div>
              <div className="flex items-center gap-4 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                <RefreshCw size={18} className="text-primary/40" />
                30-Day Easy Returns
              </div>
            </div>
          </div>

          {/* Promo Code */}
          {isCouponsEnabled && (
            <div className="bg-white rounded-[32px] p-8 shadow-ambient mt-8">
              <h3 className="text-sm font-bold mb-6 text-on-surface/60 uppercase tracking-widest text-[10px]">Have a promo code?</h3>
              <div className="space-y-3">
                <div className="flex items-center bg-surface-container-low rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-primary/10 transition-all border border-transparent">
                  <input
                    type="text"
                    placeholder="Enter code"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-sm font-bold"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isApplying || !!appliedCoupon}
                    className="btn-primary px-8 py-3 text-sm disabled:opacity-50 transition-all rounded-xl shrink-0"
                  >
                    {isApplying ? '...' : appliedCoupon ? 'Applied ✓' : 'Apply'}
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {couponError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl overflow-hidden"
                    >
                      <div className="text-red-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                        <span>{couponError}</span>
                      </div>
                    </motion.div>
                  )}

                  {appliedCoupon && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-100 overflow-hidden"
                    >
                      <div className="text-green-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-green-600 shrink-0" />
                        <span>Code "{appliedCoupon.code}" Active</span>
                      </div>
                      <button
                        onClick={() => setAppliedCoupon(null)}
                        className="text-[10px] text-red-400 underline uppercase font-bold hover:text-red-600 shrink-0 ml-4"
                      >
                        Remove
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;