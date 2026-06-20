import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, Mail, LogOut, Package, Heart, Settings, AlertCircle, ChevronRight, Clock, MapPin, Camera, Save, CheckCircle2, ArrowLeft, Loader2, KeyRound, Timer, Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';
import { getOrders, WooOrder, updateMe, forgotPassword, updateCustomer, resetPassword, getStoredUser } from '../services/wordpress';
import ProductCard from '../components/ProductCard';
import { authService } from '../services/auth';
import OrderDetails from '../components/OrderDetails';

const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-50 text-green-600 border-green-100';
    case 'processing':
      return 'bg-blue-50 text-blue-600 border-blue-100';
    case 'cancelled':
    case 'failed':
      return 'bg-red-50 text-red-600 border-red-100';
    case 'on-hold':
      return 'bg-yellow-50 text-yellow-600 border-yellow-100';
    default:
      return 'bg-primary/5 text-primary border-primary/10';
  }
};

const Account: React.FC = () => {
  const { user, login, register, logout, isAuthenticated } = useAuth();
  const { wishlist } = useWishlist();
  const [view, setView] = useState<'login' | 'register' | 'forgot-password' | 'enter-code'>('login');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'wishlist' | 'addresses' | 'settings'>('dashboard');
  const [orders, setOrders] = useState<WooOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [formData, setFormData] = useState({ email: '', username: '', password: '', code: '', newPassword: '' });

  const [resendTimer, setResendTimer] = useState(0);
  const [validityTimer, setValidityTimer] = useState(0);


  // Profile & Address States
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  // Initialize address data from user object if available
  const [addressData, setAddressData] = useState({
    billing: {
      first_name: '',
      last_name: '',
      address_1: '',
      city: '',
      state: '',    // This is Province
      postcode: '', // This is ZIP
      phone: '',
      email: user?.user_email || ''
    },
    shipping: {
      first_name: '',
      last_name: '',
      address_1: '',
      city: '',
      state: '',    // This is Province
      postcode: '', // This is ZIP
      phone: '',
      email: user?.user_email || ''
    }
  });

  // Effect to update profileData when user object changes (e.g., after login)
  useEffect(() => {
    if (user) {
      setAddressData({
        billing: {
          first_name: user.billing?.first_name || '',
          last_name: user.billing?.last_name || '',
          address_1: user.billing?.address_1 || '',
          city: user.billing?.city || '',
          state: user.billing?.state || '',
          postcode: user.billing?.postcode || '',
          phone: user.billing?.phone || '',
          email: user.billing?.email || user.user_email || ''
        },
        shipping: {
          first_name: user.shipping?.first_name || '',
          last_name: user.shipping?.last_name || '',
          address_1: user.shipping?.address_1 || '',
          city: user.shipping?.city || '',
          state: user.shipping?.state || '',
          postcode: user.shipping?.postcode || '',
          phone: user.shipping?.phone || '',
          email: user.shipping?.email || user.user_email || ''
        }
      });
    }
  }, [user]);

  // Add this useEffect alongside the existing addressData one
  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.user_email || ''
      });
    }
  }, [user]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (validityTimer > 0) {
      interval = setInterval(() => setValidityTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [validityTimer]);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const res = await getOrders();
    if (res.success && res.data) {
      setOrders(res.data);
    }
    setOrdersLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'orders') {
      ;
      fetchOrders();
    }
  }, [isAuthenticated, activeTab, user?.id]);

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (view === 'register' && !validatePassword(formData.password)) {
        throw new Error('Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.');
      }

      if (view === 'login') {
        await login(formData.username, formData.password);
        // Redirect user after successful login
        navigate(from, { replace: true });
      } else if (view === 'register') {
        await register(formData.email, formData.username, formData.password);
        setSuccessMsg('Account created successfully! You can now log in.');
        setTimeout(() => setView('login'), 2000);
      } else if (view === 'forgot-password') {
        if (resendTimer > 0) throw new Error(`Please wait ${resendTimer}s to request again.`);

        const res = await forgotPassword(formData.email);
        // Security: Always show success unless it's a network/server failure
        if (res.success || (res.error && res.error.code !== 'NETWORK_ERROR')) {
          setSuccessMsg('If an account exists for that email, a password reset code has been sent.');
          setResendTimer(60); // 1 minute cooldown
          setValidityTimer(120); // 2 minute validity
          setTimeout(() => setView('enter-code'), 1500);
        } else {
          setError(res.error?.message || 'Failed to process request.');
        }
      } else if (view === 'enter-code') {
        if (validityTimer === 0) throw new Error('Code has expired. Please request a new one.');

        const res = await resetPassword(formData.email, formData.code, formData.newPassword);
        if (res.success) {
          setSuccessMsg('Password reset successfully! You can now login.');
          setValidityTimer(0);
          setTimeout(() => setView('login'), 2000);
        } else {
          setError(res.error?.message || 'Invalid code or request failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    const res = await updateMe({
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      email: profileData.email
    });
    if (res.success && res.data) {
      // Update local storage and context state
      authService.updateLocalUser({
        ...user!,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        user_email: res.data.email,
        user_display_name: `${res.data.first_name} ${res.data.last_name}`.trim() || user!.user_display_name
      });
      setSuccessMsg('Profile updated successfully!');
    } else {
      setError(res.error?.message || 'Update failed');
    }
    setLoading(false);
  };

  const handleUpdateAddresses = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneRegex = /^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$/;


    if (!phoneRegex.test(addressData.shipping.phone) || !phoneRegex.test(addressData.billing.phone)) {
      setError('Please enter a valid Pakistani phone number (e.g., 03001234567).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await updateCustomer(user.id, {
        billing: addressData.billing,
        shipping: addressData.shipping,
      });


      if (res) {

        authService.updateLocalUser({
          ...user,
          billing: addressData.billing,
          shipping: addressData.shipping
        });
        setSuccessMsg('Full address profiles saved successfully!');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save address info. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-24">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="p-6 bg-surface-container-low rounded-3xl mb-6">
              <div className="relative group w-20 h-20 mb-4 mx-auto md:mx-0">
                {user.avatar_urls && user.avatar_urls['96'] ? (
                  <img src={user.avatar_urls['96']} alt="Avatar" className="w-full h-full rounded-2xl object-cover shadow-sm" />
                ) : (
                  <div className="w-full h-full bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-display font-bold text-2xl">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
                <button className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-lg shadow-ambient text-on-surface/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
                  <Camera size={14} />
                </button>
              </div>
              <h2 className="font-display font-bold text-xl truncate">{user.user_display_name}</h2>
              <p className="text-sm text-on-surface/40 truncate">{user.user_email}</p>
            </div>
            {[
              { id: 'dashboard', label: 'Overview', icon: User },
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'wishlist', label: 'Wishlist', icon: Heart },
              { id: 'addresses', label: 'Addresses', icon: MapPin },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn("w-full flex items-center gap-4 p-4 rounded-2xl transition-all font-bold group", activeTab === item.id ? "bg-primary text-white" : "text-on-surface/60 hover:bg-surface-container-low hover:text-primary")}>
                <item.icon size={20} className="group-hover:scale-110 transition-transform" /> {item.label}
              </button>
            ))}
            <button onClick={logout} className="w-full flex items-center gap-4 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all mt-8">
              <LogOut size={20} /> Logout
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 bg-surface-container-low rounded-3xl p-10 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div key="dash" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h1 className="text-3xl font-display font-extrabold mb-8">Dashboard</h1>
                  <p className="text-on-surface/60 mt-2">
                    Welcome back, <span className="text-primary font-bold">
                      {user?.display_name || user?.username || user?.email?.split('@')[0] || 'User'}
                    </span>! ! From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.
                  </p>
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div key="orders" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h1 className="text-3xl font-display font-extrabold mb-8">Order History</h1>
                  {ordersLoading ? (
                    <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className="bg-white p-6 rounded-2xl flex items-center justify-between border border-outline-variant/5 hover:border-primary/20 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                              <Package size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold">Order #{order.number}</h4>
                              <div className="flex items-center gap-3 text-xs mt-1 font-medium">
                                <span className="flex items-center gap-1 text-on-surface/40">
                                  <Clock size={12} /> {new Date(order.date_created).toLocaleDateString()}
                                </span>
                                {/* DYNAMIC STATUS BADGE */}
                                <span className={cn(
                                  "capitalize px-2 py-0.5 rounded-md border text-[10px] font-bold transition-colors",
                                  getStatusStyles(order.status)
                                )}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-lg text-primary">
                              Rs. {parseFloat(order.total).toLocaleString()}
                            </p>
                            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/30 group-hover:text-primary transition-colors flex items-center gap-1 ml-auto mt-1">
                              Details <ChevronRight size={12} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-outline-variant/20">
                      <Package className="mx-auto text-on-surface/10 mb-4" size={48} />
                      <p className="text-on-surface/40 font-bold">You haven't placed any orders yet.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                  <h1 className="text-3xl font-display font-extrabold mb-8">My Wishlist</h1>
                  {wishlist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {wishlist.map(product => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-outline-variant/20">
                      <Heart className="mx-auto text-on-surface/10 mb-4" size={48} />
                      <p className="text-on-surface/40 font-bold">Your wishlist is empty.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'addresses' && (
                <motion.div key="addresses" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-2xl mx-auto">
                  <h1 className="text-3xl font-display font-extrabold mb-8">Addresses</h1>
                  <form onSubmit={handleUpdateAddresses} className="space-y-12">

                    {/* 1. SHIPPING ADDRESS (On Top) */}
                    <div className="space-y-6">
                      <h3 className="font-bold text-xs text-primary uppercase tracking-[0.2em] pb-2 border-b border-outline-variant/10">
                        Shipping Address
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="First Name"
                          value={addressData.shipping.first_name}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm"
                          onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, first_name: e.target.value } })}
                        />
                        <input
                          placeholder="Last Name"
                          value={addressData.shipping.last_name}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm"
                          onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, last_name: e.target.value } })}
                        />
                      </div>
                      <input
                        placeholder="Street Address"
                        value={addressData.shipping.address_1}
                        className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm"
                        onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, address_1: e.target.value } })}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input placeholder="City" value={addressData.shipping.city} className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm" onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, city: e.target.value } })} />
                        <input placeholder="Province" value={addressData.shipping.state} className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm" onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, state: e.target.value } })} />
                        <input placeholder="ZIP" value={addressData.shipping.postcode} className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm" onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, postcode: e.target.value } })} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="tel"
                          pattern="^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$"
                          title="Enter a valid Pakistani number (e.g. 03001234567)"
                          placeholder="Shipping Phone"
                          value={addressData.shipping.phone}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm invalid:border-red-400"
                          onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, phone: e.target.value } })}
                        />
                        <input
                          type="email"
                          placeholder="Shipping Email"
                          value={addressData.shipping.email}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm invalid:border-red-400"
                          onChange={(e) => setAddressData({ ...addressData, shipping: { ...addressData.shipping, email: e.target.value } })}
                        />
                      </div>
                    </div>

                    {/* 2. BILLING ADDRESS (Below) */}
                    <div className="space-y-6 pt-6 border-t border-outline-variant/10">
                      <h3 className="font-bold text-xs text-primary uppercase tracking-[0.2em] pb-2">
                        Billing Address
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          placeholder="First Name"
                          value={addressData.billing.first_name}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm"
                          onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, first_name: e.target.value } })}
                        />
                        <input
                          placeholder="Last Name"
                          value={addressData.billing.last_name}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm"
                          onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, last_name: e.target.value } })}
                        />
                      </div>
                      <input
                        placeholder="Street Address"
                        value={addressData.billing.address_1}
                        className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm"
                        onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, address_1: e.target.value } })}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input placeholder="City" value={addressData.billing.city} className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm" onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, city: e.target.value } })} />
                        <input placeholder="Province" value={addressData.billing.state} className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm" onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, state: e.target.value } })} />
                        <input placeholder="ZIP" value={addressData.billing.postcode} className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm" onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, postcode: e.target.value } })} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="tel"
                          pattern="^((\+92)|(0092))?3[0-9]{9}$|^03[0-9]{9}$"
                          title="Enter a valid Pakistani number"
                          placeholder="Billing Phone"
                          value={addressData.billing.phone}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm invalid:border-red-400"
                          onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, phone: e.target.value } })}
                        />
                        <input
                          type="email"
                          placeholder="Billing Email"
                          value={addressData.billing.email}
                          className="w-full px-5 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold text-sm shadow-sm invalid:border-red-400"
                          onChange={(e) => setAddressData({ ...addressData, billing: { ...addressData.billing, email: e.target.value } })}
                        />
                      </div>
                    </div>
                    {successMsg && (
                      <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={18} /> {successMsg}
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto px-12 py-4 flex items-center justify-center gap-2 rounded-2xl shadow-lg">
                      {loading ? <Loader2 size={20} className="animate-spin" /> : <><Save size={20} /> Save All Addresses</>}
                    </button>
                  </form>
                </motion.div>
              )}
              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                  <h1 className="text-3xl font-display font-extrabold mb-8">Account Details</h1>
                  <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface/40 px-1">First Name</label>
                        <input
                          value={profileData.first_name}
                          onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                          className="w-full p-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-on-surface/40 px-1">Last Name</label>
                        <input
                          value={profileData.last_name}
                          onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                          className="w-full p-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface/40 px-1">Email Address</label>
                      <input
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full p-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface/40 px-1">Username (Cannot be changed)</label>
                      <input
                        disabled
                        value={user.username}
                        className="w-full p-4 bg-on-surface/5 rounded-2xl outline-none border border-transparent text-on-surface/40 font-medium cursor-not-allowed"
                      />
                    </div>

                    {successMsg && (
                      <div className="flex items-center gap-2 p-4 bg-green-50 text-green-600 rounded-2xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
                        <CheckCircle2 size={18} /> {successMsg}
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="btn-primary px-10 py-4 flex items-center gap-2">
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Save Changes</>}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {selectedOrder && (
          <OrderDetails
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onRefresh={fetchOrders}
          />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-8 py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-display font-extrabold tracking-tight mb-4">
          {view === 'login' ? 'Welcome Back' : view === 'register' ? 'Create Account' : view === 'forgot-password' ? 'Reset Password' : 'Verify Code'}
        </h1>
        <p className="text-on-surface/40 font-medium">
          {view === 'login' ? 'Enter your details to access your account' : view === 'register' ? 'Join TeezMart for a premium shopping experience' : view === 'forgot-password' ? 'Enter your email to receive a reset code' : 'Check your email for the 6-digit verification code'}
        </p>
      </div>

      <div className="bg-surface-container-low p-8 rounded-3xl shadow-sm border border-outline-variant/10">
        <form onSubmit={handleSubmit} className="space-y-5">
          {view === 'register' && (
            <div className="relative mt-4">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input
                type="text"
                placeholder="Username"
                required
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}

          {(view === 'register' || view === 'forgot-password' || view === 'enter-code') && (
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                disabled={view === 'enter-code'}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          )}

          {view === 'login' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input
                type="text"
                placeholder="Username or Email"
                required
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                onChange={e => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          )}

          {view === 'enter-code' && (
            <div className="space-y-5">
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
                <input
                  type="text"
                  placeholder="Verification Code"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/20 group-focus-within:text-primary transition-colors" size={20} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter New Password"
                  className="w-full pl-12 pr-12 py-4 bg-white rounded-2xl outline-none border border-transparent focus:border-primary/20 font-bold transition-all"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/30 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validityTimer > 0 && (
                <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs">
                  <Timer size={14} className="animate-pulse" /> Code expires in: {Math.floor(validityTimer / 60)}:{(validityTimer % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/30 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}

          {view === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => setView('forgot-password')}
                className="text-xs font-bold text-on-surface/40 hover:text-primary transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          <AnimatePresence>
            {successMsg && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-green-50 text-green-600 rounded-xl text-xs font-bold">
                <CheckCircle2 size={14} /> {successMsg}
              </motion.div>
            )}
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center h-14"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (view === 'login' ? 'Sign In' : view === 'register' ? 'Register' : view === 'forgot-password' ? 'Send Code' : 'Reset Password')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setView(view === 'login' ? 'register' : 'login')}
            className="text-sm font-bold text-on-surface/40 hover:text-primary transition-colors"
          >
            {view === 'login' ? "Don't have an account?  Sign Up" : "Back to Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;