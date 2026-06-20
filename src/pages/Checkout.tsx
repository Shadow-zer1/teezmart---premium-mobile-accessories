import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard, Truck, ShieldCheck, CheckCircle2, ArrowRight, Clock, Building2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { cn } from '../lib/utils';
import { getPaymentGateways, createOrder, getShippingMethods, getShippingMethodsGQL, addOrderNote, type WooPaymentGateway } from '../services/wordpress';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const formatPKR = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatOrderID = (id: number | string): string => {
  const date = new Date().getFullYear();
  return `TM-${date}-${id.toString().padStart(4, '0')}`;
};

// Helper to get payment gateway icon
const getGatewayIcon = (gatewayId: string) => {
  if (gatewayId === 'bacs' || gatewayId.includes('bank') || gatewayId.includes('bacs')) {
    return <Building2 size={22} className="text-on-surface/30" />;
  }
  if (gatewayId.includes('jazz') || gatewayId.includes('easy') || gatewayId.includes('mobile')) {
    return <Smartphone size={22} className="text-on-surface/30" />;
  }
  return <CreditCard size={22} className="text-on-surface/30" />;
};

// ─── FIX 1: Extend WooPaymentGateway type to include all BACS fields ─────────
// Make sure your wordpress.ts service type also has these fields.
// If you can't edit the type, the interface below shows what fields to expect.
// 1. Define the Bank Account structure first
interface BankAccount {
  account_name: string;
  account_number: string;
  bank_name: string;
  sort_code?: string;
  iban?: string;
  bic?: string;
}

// 2. Extend by omitting the strict 'description' from the base
interface ExtendedGateway extends Omit<WooPaymentGateway, 'description'> {
  // Now we can safely make it optional or keep it required
  description?: string;
  instructions?: string;

  settings?: {
    instructions?: { value: string };
    // Added: This is the typical standard WooCommerce API path for BACS account details
    account_details?: { value: BankAccount[] };
    accounts?: { value: BankAccount[] };
    // Using a more specific index signature for settings
    [key: string]: any;
  };
}


const Checkout: React.FC = () => {
  const getLabel = (attr: any): string => {
    // 1. If it's empty, null, or undefined, don't crash, just return "Standard"
    if (!attr) return "Standard";

    // 2. If it's already a string, just return it
    if (typeof attr === 'string') return attr;

    // 3. If it's an object, grab the first value regardless of the key name
    if (typeof attr === 'object') {
      const values = Object.values(attr);
      if (values.length > 0) {
        return String(values[0]); // Returns "Space Gray" or "100W" automatically
      }
    }

    return "Standard";
  };

  const formatAttributeLabel = (label: string): string =>
    label
      .replace(/^pa_/, '')
      .replace(/^#\s*/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();

  const [pickupDate, setPickupDate] = useState(new Date().toISOString().split('T')[0]);
  const [pickupTime, setPickupTime] = useState('12:00');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const location = useLocation();
  const [serverTotals, setServerTotals] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    phone: '',
    email: '',
  });
  const { cart, cartTotal, clearCart, settings } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState<'shipping' | 'payment' | 'success'>('shipping');
  const [gateways, setGateways] = useState<ExtendedGateway[]>([]);
  const [isLoadingGateways, setIsLoadingGateways] = useState(true);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState<any>({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    province: '',
    country: 'PK',
    zipCode: '',
    phone: '',
    paymentMethod: 'cod',
  });

  const { shippingThreshold, flatRateCost, taxRate, isTaxEnabled } = settings;

  const taxAmount = isTaxEnabled ? (cartTotal * taxRate) : 0;

  // catch the coupon from the Cart page, or default to null
  const [appliedCoupon, setAppliedCoupon] = useState<any>(location.state?.appliedCoupon || null);

  // --- DYNAMIC CALCULATIONS ---
  const discountAmount = (() => {
    if (!appliedCoupon) return 0;
    const amt = parseFloat(appliedCoupon.amount);
    return appliedCoupon.discount_type === 'percent' ? (cartTotal * amt) / 100 : amt;
  })();

  // bacs fix
  const [selectedBankAccount, setSelectedBankAccount] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev: any) => ({
        ...prev,
        firstName: user.shipping?.first_name || user.first_name || '',
        lastName: user.shipping?.last_name || user.last_name || '',
        address: user.shipping?.address_1 || '',
        city: user.shipping?.city || '',
        province: user.shipping?.state || '',
        zipCode: user.shipping?.postcode || '',
        phone: user.shipping?.phone || user.billing?.phone || '',
        email: user.shipping?.email || user.user_email || '',
      }));
      setBillingData({
        firstName: user.billing?.first_name || '',
        lastName: user.billing?.last_name || '',
        address: user.billing?.address_1 || '',
        city: user.billing?.city || '',
        province: user.billing?.state || '',
        zipCode: user.billing?.postcode || '',
        phone: user.billing?.phone || '',
        email: user.billing?.email || user.user_email || '',
      });
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    const fetchGateways = async () => {
      setIsLoadingGateways(true);
      const res = await getPaymentGateways();

      if (res.success && res.data) {
        const active = res.data.filter((g: any) => {
          // Normalize 'yes', 'true', or true to a string comparison
          const isEnabled = g.enabled?.toString() === 'true' || g.enabled?.toString() === 'yes';
          return isEnabled;
        });

        setGateways(active as ExtendedGateway[]);

        // Only set default if one isn't already selected to prevent resetting user choice
        if (active.length > 0 && !formData.paymentMethod) {
          setFormData((prev: any) => ({ ...prev, paymentMethod: active[0].id }));
        }
      }
      setIsLoadingGateways(false);
    };

    const fetchShipping = async () => {
      // Try GraphQL first
      let res = await getShippingMethodsGQL();
      let allMethods: any[] = [];
      if (res.success && res.data && res.data.length > 0) {
        allMethods = res.data.filter((m: any) => m.enabled === true || m.enabled === 'yes');
      } else {
        // Fallback to REST
        let res = await getShippingMethods(1);
        if (res.success && res.data) {
          allMethods = res.data.filter((m: any) => m.enabled === true || m.enabled === 'yes');
        }
      }

      // Always add local pickup if not present
      const hasLocalPickup = allMethods.some(m => m.method_id === 'local_pickup');
      if (!hasLocalPickup) {
        allMethods.push({
          id: 'local_pickup',
          method_id: 'local_pickup',
          title: 'Local Pickup',
          method_title: 'Local Pickup',
          method_description: 'Pick up your order from our store',
          enabled: true,
          settings: {
            cost: { value: '0' },
            title: { value: 'Local Pickup' },
          },
        });
      }

      // Use context-provided threshold for the initial filter logic
      const minAmountNeeded = shippingThreshold;

      let filteredMethods = allMethods;

      // If the cart total hits the DYNAMIC threshold, only show the free option
      if (minAmountNeeded > 0 && cartTotal >= shippingThreshold) {
        filteredMethods = allMethods.filter(m => m.method_id === 'free_shipping' || m.method_id === 'local_pickup');
      } else {
        // Otherwise, hide Free Shipping so they don't see it until they qualify
        filteredMethods = allMethods.filter(m => m.method_id !== 'free_shipping');
      }

      setShippingMethods(filteredMethods);
      if (filteredMethods.length > 0) setSelectedShipping(filteredMethods[0]);
    };


    fetchGateways();
    fetchShipping();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'shipping') {
      setStep('payment');
      return;
    }

    // order notes fix

    if (step === 'payment') {
      setIsSubmitting(true);
      setOrderError(null);

      const selectedGateway = gateways.find(g => g.id === formData.paymentMethod);
      const isLocalPickup =
        selectedShipping?.method_id === 'local_pickup' ||
        selectedShipping?.id === 'local_pickup';

      const orderData = {
        payment_method: formData.paymentMethod,
        payment_method_title: selectedGateway?.title || 'Cash on Delivery',
        set_paid: false,
        meta_data: [
          {
            key: '_selected_bank_name',
            value: String(selectedBankAccount?.bank_name || 'N/A')
          },
          {
            key: '_selected_account_number',
            value: String(selectedBankAccount?.account_number || 'N/A')
          }
        ],
        coupon_lines: appliedCoupon ? [{ code: appliedCoupon.code }] : [],
        billing: {
          first_name: billingSameAsShipping ? formData.firstName : billingData.firstName,
          last_name: billingSameAsShipping ? formData.lastName : billingData.lastName,
          address_1: billingSameAsShipping ? formData.address : billingData.address,
          address_2: '',
          city: billingSameAsShipping ? formData.city : billingData.city,
          state: billingSameAsShipping ? formData.province : billingData.province,
          postcode: billingSameAsShipping ? formData.zipCode : billingData.zipCode,
          country: formData.country,
          email: formData.email,
          phone: billingSameAsShipping ? formData.phone : billingData.phone,
          company: '',
          customer_note: selectedBankAccount
            ? `Customer selected to pay via ${selectedBankAccount.bank_name} (${selectedBankAccount.account_number})`
            : ''
        },
        shipping: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          address_1: formData.address,
          address_2: '',
          city: formData.city,
          state: formData.province,
          postcode: formData.zipCode,
          country: formData.country,
          company: '',
        },
        line_items: cart.map(item => ({
          product_id: parseInt(item.id),
          quantity: item.quantity,
          meta_data: [
            { key: 'Color', value: item.selectedColor },
            { key: 'Model', value: item.selectedModel },
            ...(isLocalPickup
              ? [
                { key: 'Pickup Date', value: pickupDate },
                { key: 'Pickup Time', value: pickupTime },
              ]
              : []),
          ],
        })),
        shipping_lines: selectedShipping
          ? [
            {
              method_id: selectedShipping.method_id || selectedShipping.id,
              method_title: selectedShipping.title,
              total: selectedShipping.settings?.cost?.value || '0',
            },
          ]
          : [],
      };

      try {

        // Inside handlePlaceOrder, after createOrder(orderData)
        const res = await createOrder(orderData);

        if (res.success && res.data) {
          const newOrderId = res.data.id;

          // MANDATORY: Manually push the bank selection to the sidebar timeline
          if (selectedBankAccount) {
            const sidebarMsg = `BANK SELECTION: ${selectedBankAccount.bank_name} - ${selectedBankAccount.account_number}`;
            // This second call puts it in the 'Order notes' sidebar you saw in the image
            await addOrderNote(newOrderId, sidebarMsg);
          }

          setLastOrder(res.data);
          setStep('success');
          clearCart();
        }
        else {
          setOrderError(res.error?.message || 'Failed to place order. Please try again.');
        }
      } catch (err) {
        setOrderError('Network error. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const shippingCost = selectedShipping
    ? parseFloat(selectedShipping.settings?.cost?.value || '0') || 0
    : (cartTotal >= shippingThreshold ? 0 : (flatRateCost || 0));
  const grandTotal = cartTotal + shippingCost + taxAmount - discountAmount;

  // ─── FIX 4: Helper to get instructions text from gateway ─────────────────
  const getGatewayInstructions = (gateway: ExtendedGateway): string => {
    return (
      gateway.instructions ||
      gateway.settings?.instructions?.value ||
      gateway.description ||
      ''
    );
  };

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-10 text-primary shadow-ambient">
            <CheckCircle2 size={56} />
          </div>
          <h1 className="text-5xl font-display font-extrabold tracking-tight mb-6">
            Order Confirmed!
          </h1>
          <p className="text-on-surface/40 font-medium mb-12 leading-relaxed">
            Thank you for your purchase. Your order{' '}
            {lastOrder ? formatOrderID(lastOrder.id) : ''} has been placed and is being
            processed. We've sent a confirmation email to {formData.email}.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/account" className="btn-primary px-12 py-5 text-lg">
              Track Order
            </Link>
            <Link to="/" className="btn-secondary px-12 py-5 text-lg">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
      {/* Header */}
      <div className="flex items-center gap-6 mb-16">
        <button
          onClick={() => navigate(-1)}
          className="p-3 hover:bg-surface-container-low rounded-full transition-all duration-300 text-on-surface/40 hover:text-primary"
        >
          <ChevronLeft size={28} />
        </button>
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-2 block">
            Secure Checkout
          </span>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight">
            Checkout
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* ── Left: Form ── */}
        <div className="lg:col-span-2">
          {/* Progress Bar */}
          <div className="flex gap-6 mb-16">
            <div
              className={cn(
                'flex-1 h-1.5 rounded-full transition-all duration-700',
                step === 'shipping' || step === 'payment'
                  ? 'bg-primary shadow-[0_0_12px_rgba(0,89,187,0.3)]'
                  : 'bg-surface-container-low'
              )}
            />
            <div
              className={cn(
                'flex-1 h-1.5 rounded-full transition-all duration-700',
                step === 'payment'
                  ? 'bg-primary shadow-[0_0_12px_rgba(0,89,187,0.3)]'
                  : 'bg-surface-container-low'
              )}
            />
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-16">
            <AnimatePresence mode="wait">

              {/* ══════════════ STEP 1: SHIPPING ══════════════ */}
              {step === 'shipping' && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="space-y-12"
                >
                  {/* Contact Info */}
                  <section>
                    <h2 className="text-2xl font-display font-extrabold mb-8 flex items-center gap-4 tracking-tight">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-ambient">
                        1
                      </div>
                      Contact Information
                    </h2>
                    <div className="grid grid-cols-1 gap-6">
                      <input
                        required
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                      <input
                        required
                        type="tel"
                        name="phone"
                        pattern="^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$"
                        title="Please enter a valid Pakistani number (e.g. 03001234567)"
                        placeholder="Phone Number (03xxxxxxxxx)"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                    </div>
                  </section>

                  {/* Shipping Address */}
                  <section>
                    <h2 className="text-2xl font-display font-extrabold mb-8 flex items-center gap-4 tracking-tight">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-ambient">
                        2
                      </div>
                      Shipping Address
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input
                        required
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                      <input
                        required
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                      <input
                        required
                        type="text"
                        name="address"
                        placeholder="Street Address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full md:col-span-2 px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                      <input
                        required
                        type="text"
                        name="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                      <input
                        required
                        type="text"
                        name="province"
                        placeholder="Province / State"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                      <input
                        required
                        type="text"
                        name="zipCode"
                        placeholder="ZIP / Postal Code"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-6 py-5 bg-surface-container-low border-none rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold text-lg"
                      />
                    </div>

                    {/* Billing Toggle */}
                    <div className="mt-10 pt-10 border-t border-outline-variant/10">
                      <div
                        className="flex items-center gap-3 mb-8 cursor-pointer group"
                        onClick={() => setBillingSameAsShipping(!billingSameAsShipping)}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
                            billingSameAsShipping
                              ? 'bg-primary border-primary'
                              : 'border-on-surface/20 group-hover:border-primary'
                          )}
                        >
                          {billingSameAsShipping && (
                            <div className="w-2 h-4 border-r-2 border-b-2 border-white rotate-45 -mt-1" />
                          )}
                        </div>
                        <span className="text-sm font-bold text-on-surface/60">
                          Billing address is the same as shipping
                        </span>
                      </div>

                      <AnimatePresence>
                        {!billingSameAsShipping && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-8 mt-10 pt-10 border-t border-outline-variant/10"
                          >
                            <h3 className="text-2xl font-display font-extrabold tracking-tight">
                              Billing Address
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                              <input
                                required
                                placeholder="First Name"
                                value={billingData.firstName}
                                onChange={e =>
                                  setBillingData({ ...billingData, firstName: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <input
                                required
                                placeholder="Last Name"
                                value={billingData.lastName}
                                onChange={e =>
                                  setBillingData({ ...billingData, lastName: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <input
                                required
                                placeholder="Street Address"
                                value={billingData.address}
                                onChange={e =>
                                  setBillingData({ ...billingData, address: e.target.value })
                                }
                                className="md:col-span-6 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <input
                                required
                                placeholder="City"
                                value={billingData.city}
                                onChange={e =>
                                  setBillingData({ ...billingData, city: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <input
                                required
                                placeholder="Province / State"
                                value={billingData.province}
                                onChange={e =>
                                  setBillingData({ ...billingData, province: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <input
                                required
                                placeholder="ZIP / Postal Code"
                                value={billingData.zipCode}
                                onChange={e =>
                                  setBillingData({ ...billingData, zipCode: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <div className="hidden md:block md:col-span-3" />
                              <input
                                required
                                type="tel"
                                placeholder="Billing Phone"
                                value={billingData.phone}
                                onChange={e =>
                                  setBillingData({ ...billingData, phone: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                              <input
                                required
                                type="email"
                                placeholder="Billing Email"
                                value={billingData.email || ''}
                                onChange={e =>
                                  setBillingData({ ...billingData, email: e.target.value })
                                }
                                className="md:col-span-3 px-6 py-4 bg-surface-container-low rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all font-bold"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                  {/* ─── FIX 5: SHIPPING METHOD SECTION (Local Pickup now shows) ─── */}
                  <section>
                    <h2 className="text-2xl font-display font-extrabold mb-8 flex items-center gap-4 tracking-tight">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-ambient">
                        3
                      </div>
                      Delivery Method
                    </h2>

                    {shippingMethods.length === 0 ? (
                      <div className="p-6 bg-surface-container-low rounded-2xl text-on-surface/40 font-medium text-sm">
                        Loading delivery options...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {shippingMethods.map(method => {
                          const isLocalPickup =
                            method.method_id === 'local_pickup' || method.id === 'local_pickup';
                          const cost = parseFloat(method.settings?.cost?.value || '0') || 0;
                          const isSelected = selectedShipping?.id === method.id || selectedShipping?.method_id === method.method_id;

                          return (
                            <div key={method.id || method.method_id} className="flex flex-col">
                              <label
                                onClick={() => setSelectedShipping(method)}
                                className={cn(
                                  'flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all',
                                  isSelected
                                    ? isLocalPickup
                                      ? 'border-primary bg-primary/5 rounded-b-none border-b-0'
                                      : 'border-primary bg-primary/5'
                                    : 'border-surface-container-low hover:border-primary/30'
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={cn(
                                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                                      isSelected ? 'border-primary' : 'border-on-surface/20'
                                    )}
                                  >
                                    {isSelected && (
                                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-lg">{method.title}</div>
                                    {method.description && (
                                      <div className="text-xs text-on-surface/40 mt-0.5">
                                        {method.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="font-display font-extrabold text-primary text-lg">
                                  {cost > 0 ? `Rs. ${formatPKR(cost)}` : 'FREE'}
                                </div>
                              </label>

                              {/* Local Pickup date/time picker */}
                              {isLocalPickup && isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="px-6 py-5 bg-primary/5 border-2 border-primary border-t-0 rounded-b-2xl"
                                >
                                  <p className="text-sm font-bold text-on-surface/50 mb-4 flex items-center gap-2">
                                    <Clock size={14} />
                                    Schedule your pickup
                                  </p>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-xs font-bold text-on-surface/40 mb-1.5 block uppercase tracking-widest">
                                        Date
                                      </label>
                                      <input
                                        type="date"
                                        value={pickupDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => setPickupDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold text-on-surface/40 mb-1.5 block uppercase tracking-widest">
                                        Time
                                      </label>
                                      <input
                                        type="time"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                        className="w-full px-4 py-3 bg-white rounded-xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <button
                    type="submit"
                    className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3"
                  >
                    Continue to Payment
                    <ArrowRight size={24} />
                  </button>
                </motion.div>
              )}

              {/* ══════════════ STEP 2: PAYMENT ══════════════ */}
              {step === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="space-y-12"
                >
                  <section>
                    <h2 className="text-2xl font-display font-extrabold mb-8 flex items-center gap-4 tracking-tight">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-ambient">
                        4
                      </div>
                      Payment Method
                    </h2>

                    {isLoadingGateways ? (
                      <div className="p-6 bg-surface-container-low rounded-2xl text-on-surface/40 font-medium text-sm">
                        Loading payment options...
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {gateways.map((gateway) => {
                          const isSelected = formData.paymentMethod === gateway.id;

                          // 1. EXTRACT DATA: Get both description and instructions separately
                          const description = gateway.description || gateway.settings?.description?.value || '';
                          const instructions = gateway.instructions || gateway.settings?.instructions?.value || '';

                          return (
                            <div key={gateway.id} className="flex flex-col">
                              {/* --- Method Label --- */}
                              <label
                                onClick={() => setFormData({ ...formData, paymentMethod: gateway.id })}
                                className={cn(
                                  "flex items-center justify-between p-6 rounded-2xl border-2 cursor-pointer transition-all",
                                  isSelected
                                    ? "border-primary bg-primary/5 rounded-b-none border-b-0"
                                    : "border-surface-container-low hover:border-primary/30"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected ? "border-primary" : "border-on-surface/20"
                                  )}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {getGatewayIcon(gateway.id)}
                                    <span className="font-bold text-lg">{gateway.title}</span>
                                  </div>
                                </div>
                              </label>

                              {/* --- Expanded Details --- */}
                              <AnimatePresence>
                                {isSelected && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-6 py-6 bg-primary/5 border-2 border-primary border-t-0 rounded-b-2xl space-y-6"
                                  >
                                    {/* 2. REQUIRED DESCRIPTION: Shows general info about the method */}
                                    {description && (
                                      <p className="text-sm text-on-surface/70 leading-relaxed font-medium px-1">
                                        {description}
                                      </p>
                                    )}

                                    {/* 3. REQUIRED INSTRUCTIONS: Shows the "Alert/Note" box */}
                                    {instructions && (
                                      <div className="bg-white border border-primary/10 rounded-2xl p-5 shadow-sm">
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] block mb-2">
                                          Payment Instructions
                                        </span>
                                        <p className="text-sm text-on-surface/80 leading-relaxed font-bold">
                                          {instructions}
                                        </p>
                                      </div>
                                    )}

                                    {/* 4. SELECTABLE BANK ACCOUNTS (Jazzcash / Easypaisa) */}
                                    {/* Check both standard 'accounts' and custom 'account_details' keys */}
                                    {(() => {
                                      const accounts = (() => {
                                        const settings = gateway.settings;
                                        if (!settings) return [];

                                        // Check the path we created in PHP first
                                        const data = settings.account_details?.value || settings.accounts?.value || settings.accounts || [];

                                        // Ensure we always return an array, even if the API sends a single object
                                        return Array.isArray(data) ? data : [data];
                                      })();

                                      // Now check if accounts exist
                                      if (accounts.length > 0) {
                                        return (
                                          <div className="space-y-3 pt-2">
                                            {accounts.map((account: any, idx: number) => {
                                              // Identify the provider for custom logos/styling
                                              const name = (account.bank_name || "").toLowerCase();
                                              const isEasyPaisa = name.includes('easy');
                                              const isJazzCash = name.includes('jazz');
                                              const isSelected = selectedBankAccount?.account_number === account.account_number;

                                              return (
                                                <div
                                                  key={idx}
                                                  onClick={() => setSelectedBankAccount(account)}
                                                  className={cn(
                                                    "bg-white p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center group",
                                                    isSelected ? "border-primary bg-primary/5" : "border-primary/10 hover:border-primary/40"
                                                  )}
                                                >
                                                  <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                      {/* Visual Indicator for the Provider */}
                                                      <div className={cn(
                                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter text-white",
                                                        isEasyPaisa ? "bg-[#3bb54a]" : isJazzCash ? "bg-[#ed1c24]" : "bg-primary"
                                                      )}>
                                                        {account.bank_name}
                                                      </div>
                                                      {isSelected && <span className="text-[10px] text-primary font-bold">Selected</span>}
                                                    </div>

                                                    <p className="text-xl font-mono font-black text-on-surface tracking-tight">
                                                      {account.account_number}
                                                    </p>
                                                    <p className="text-xs text-on-surface/40 font-bold uppercase tracking-widest">
                                                      {account.account_name}
                                                    </p>
                                                  </div>

                                                  {/* Copy Button */}
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation(); // Prevent selecting the account when just copying
                                                      navigator.clipboard.writeText(account.account_number);
                                                    }}
                                                    className="p-3 bg-surface-container-low hover:bg-primary hover:text-white rounded-xl text-on-surface/40 transition-all"
                                                  >
                                                    <CreditCard size={20} />
                                                  </button>
                                                </div>
                                              );
                                            })}

                                          </div>
                                        );
                                      }


                                      if (accounts.length > 0) {
                                        return (
                                          <div className="space-y-3 pt-2">
                                            <span className="text-[10px] font-bold text-on-surface/30 uppercase tracking-widest block px-1">
                                              Select Account for Transfer
                                            </span>
                                            <div className="grid grid-cols-1 gap-3">
                                              {accounts.map((account: any, idx: number) => (
                                                <div
                                                  key={idx}
                                                  className="bg-white p-4 rounded-xl border border-primary/10 shadow-sm flex justify-between items-center transition-all hover:border-primary group"
                                                >
                                                  <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                      <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
                                                        {account.bank_name}
                                                      </p>
                                                    </div>
                                                    <p className="text-lg font-mono font-bold text-on-surface tracking-tight">
                                                      {account.account_number || account.number || account.account_details || "No Number Found"}
                                                    </p>
                                                    <p className="text-xs text-on-surface/60 font-semibold italic">
                                                      {account.account_name}
                                                    </p>
                                                  </div>

                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      const num = account.account_number || account.account_details;
                                                      navigator.clipboard.writeText(num);
                                                    }}
                                                    className="p-3 bg-primary/5 hover:bg-primary hover:text-white rounded-xl text-primary transition-all"
                                                  >
                                                    <CreditCard size={18} />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Error */}
                  {orderError && (
                    <div className="p-5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium">
                      {orderError}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="btn-secondary flex-1 py-6 text-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary flex-2 py-6 text-xl flex items-center justify-center gap-3"
                    >
                      {isSubmitting ? 'Processing...' : 'Place Order'}
                      <ShieldCheck size={24} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="space-y-10">
          <div className="bg-surface-container-low rounded-2xl p-10 sticky top-28 shadow-sm">
            <h2 className="text-2xl font-display font-extrabold mb-10 tracking-tight">
              Order Summary
            </h2>

            <div className="space-y-8 mb-10 max-h-100 overflow-y-auto pr-4 scrollbar-hide">
              <div className="space-y-8 mb-10 max-h-100 overflow-y-auto pr-4 scrollbar-hide">
                {cart.map((item, idx) => {
                  const colorStr = getLabel(item.selectedColor);
                  const modelStr = getLabel(item.selectedModel);
                  const itemAttributeText = item.allAttributes
                    ? Object.entries(item.allAttributes)
                        .map(([key, val]) => `${formatAttributeLabel(key)}: ${getLabel(val)}`)
                        .join(' • ')
                    : `${modelStr} • ${colorStr}`;

                  return (
                    <div
                      key={`${item.cartItemId || `${item.id}-${colorStr}-${modelStr}-${idx}`}`}
                      className="flex gap-6 group"
                    >
                      {/* ✅ ADD THIS IMAGE BLOCK BACK IN: */}
                      <div className="w-20 h-20 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover:shadow-ambient transition-all duration-500">
                        <img
                          src={
                            typeof item.image === 'string'
                              ? item.image
                              : (item.image?.src || 'https://picsum.photos/seed/product/400/500')
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-extrabold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-[9px] text-on-surface/30 font-label font-bold uppercase tracking-widest mt-1">
                          {itemAttributeText}
                        </p>
                        <span className="block text-lg font-display font-extrabold mt-2 text-primary">
                          Rs. {formatPKR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6 mb-10 pt-8 border-t border-outline-variant/10">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-on-surface/40">Subtotal</span>
                <span className="font-bold">Rs. {formatPKR(cartTotal)}</span>
              </div>
              {isTaxEnabled && (
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-on-surface/40">Estimated Tax</span>
                  <span className="font-bold">Rs. {formatPKR(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-medium">
                <span className="text-on-surface/40">Shipping</span>
                <span className="font-bold text-primary">
                  {shippingCost > 0 ? `Rs. ${formatPKR(shippingCost)}` : 'FREE'}
                </span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm font-bold text-green-600">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>- Rs. {formatPKR(discountAmount)}</span>
                </div>
              )}
              <div className="pt-8 border-t border-outline-variant/10 flex justify-between items-center">
                <span className="text-xl font-display font-extrabold">Total</span>
                <span className="text-3xl font-display font-extrabold text-primary">
                  Rs. {formatPKR(grandTotal)}
                </span>
              </div>
            </div>

            <div className="space-y-5 pt-8 border-t border-outline-variant/10">
              <div className="flex items-center gap-4 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                <ShieldCheck size={18} className="text-primary/40" />
                Secure Checkout Guaranteed
              </div>
              <div className="flex items-center gap-4 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                <Truck size={18} className="text-primary/40" />
                Free Express Delivery
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;