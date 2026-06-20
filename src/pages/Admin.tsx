import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  Plus, 
  MoreVertical, 
  TrendingUp, 
  TrendingDown,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PRODUCTS } from '../data';
import { cn } from '../lib/utils';

const formatPKRPrice = (usdPrice: number): string => {
  const pkrPrice = Math.round(usdPrice * 26);
  return pkrPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'customers'>('dashboard');

  const stats = [
    { label: 'Total Sales', value: 'Rs. 3,269,912', trend: '+12.5%', isUp: true, icon: BarChart3, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Orders', value: '1,245', trend: '+8.2%', isUp: true, icon: ShoppingBag, color: 'bg-green-50 text-green-600' },
    { label: 'Total Customers', value: '842', trend: '-2.4%', isUp: false, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Products', value: '156', trend: '+4.1%', isUp: true, icon: Package, color: 'bg-orange-50 text-orange-600' },
  ];

  const recentOrders = [
    { id: '#TM-2026-0402', customer: 'John Doe', date: 'Apr 02, 2026', status: 'Processing', total: 'Rs. 1,169', items: 2 },
    { id: '#TM-2026-0401', customer: 'Jane Smith', date: 'Apr 01, 2026', status: 'Delivered', total: 'Rs. 520', items: 1 },
    { id: '#TM-2026-0399', customer: 'Robert Johnson', date: 'Mar 31, 2026', status: 'Shipped', total: 'Rs. 2,339', items: 3 },
    { id: '#TM-2026-0398', customer: 'Emily Davis', date: 'Mar 31, 2026', status: 'Delivered', total: 'Rs. 3,237', items: 4 },
    { id: '#TM-2026-0397', customer: 'Michael Wilson', date: 'Mar 30, 2026', status: 'Cancelled', total: 'Rs. 910', items: 1 },
  ];

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar */}
      <aside className="w-72 bg-surface-container-low border-r border-outline-variant/10 hidden lg:flex flex-col sticky top-0 h-screen shadow-sm">
        <div className="p-8 border-b border-outline-variant/10">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-ambient group-hover:scale-110 transition-transform duration-500">
              <span className="text-white font-display font-extrabold text-2xl">T</span>
            </div>
            <span className="text-2xl font-display font-extrabold tracking-tight group-hover:text-primary transition-colors">Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-3">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'products', icon: Package, label: 'Products' },
            { id: 'orders', icon: ShoppingBag, label: 'Orders' },
            { id: 'customers', icon: Users, label: 'Customers' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-500 font-display font-extrabold text-sm tracking-tight group",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-ambient" 
                  : "text-on-surface/40 hover:bg-white/50 hover:text-primary"
              )}
            >
              <item.icon size={22} className={cn("transition-transform duration-500", activeTab === item.id ? "scale-110" : "group-hover:scale-110")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-outline-variant/10">
          <div className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-ambient transition-all duration-500 group cursor-pointer">
            <img src="https://picsum.photos/seed/admin/100/100" alt="Admin" className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-110 transition-transform duration-500" />
            <div className="min-w-0">
              <p className="text-sm font-display font-extrabold truncate group-hover:text-primary transition-colors">Admin User</p>
              <p className="text-[9px] text-primary font-label font-bold uppercase tracking-[0.2em] mt-1">Super Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-24 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 px-10 flex items-center justify-between sticky top-0 z-30">
          <div className="relative w-96 group">
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="w-full pl-14 pr-6 py-4 bg-surface-container-low border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm shadow-sm group-hover:shadow-md"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface/30 group-hover:text-primary transition-colors" size={20} />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="p-3 hover:bg-surface-container-low rounded-2xl transition-all duration-300 relative group shadow-sm bg-white">
              <Bell size={22} className="text-on-surface/40 group-hover:text-primary transition-colors" />
              <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white shadow-sm" />
            </button>
            <div className="h-10 w-px bg-outline-variant/10 mx-2" />
            <button className="btn-primary px-8 py-3.5 text-sm flex items-center gap-3">
              <Plus size={20} />
              Add Product
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-12"
              >
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-4xl font-display font-extrabold tracking-tight mb-2">Dashboard Overview</h1>
                    <p className="text-on-surface/40 text-lg font-medium">Welcome back! Here's what's happening today.</p>
                  </div>
                  <div className="flex gap-4">
                    <button className="btn-secondary px-6 py-3 text-sm">Export Report</button>
                    <button className="btn-primary px-6 py-3 text-sm">Last 30 Days</button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {stats.map((stat, i) => (
                    <div key={i} className="bg-surface-container-low p-8 rounded-2xl shadow-sm hover:shadow-ambient transition-all duration-500 group">
                      <div className="flex justify-between items-start mb-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500", stat.color)}>
                          <stat.icon size={28} />
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-label font-bold px-3 py-1.5 rounded-full shadow-sm",
                          stat.isUp ? "bg-primary/10 text-primary" : "bg-red-50 text-red-500"
                        )}>
                          {stat.isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          {stat.trend}
                        </div>
                      </div>
                      <span className="text-[9px] text-on-surface/30 font-label font-bold uppercase tracking-[0.2em]">{stat.label}</span>
                      <p className="text-3xl font-display font-extrabold mt-2 tracking-tight group-hover:text-primary transition-colors">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Recent Orders Table */}
                  <div className="lg:col-span-2 bg-surface-container-low rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-10 border-b border-outline-variant/10 flex justify-between items-center">
                      <h3 className="font-display font-extrabold text-2xl tracking-tight">Recent Orders</h3>
                      <button className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-primary hover:text-primary/70 transition-colors">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-white/50 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                            <th className="px-10 py-6">Order ID</th>
                            <th className="px-10 py-6">Customer</th>
                            <th className="px-10 py-6">Status</th>
                            <th className="px-10 py-6">Total</th>
                            <th className="px-10 py-6 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10">
                          {recentOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-white/50 transition-all duration-500 group">
                              <td className="px-10 py-6 font-display font-extrabold text-sm tracking-tight group-hover:text-primary transition-colors">{order.id}</td>
                              <td className="px-10 py-6 text-sm font-medium text-on-surface/60">{order.customer}</td>
                              <td className="px-10 py-6">
                                <span className={cn(
                                  "text-[9px] font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-2 w-fit shadow-sm",
                                  order.status === 'Delivered' ? "bg-primary/10 text-primary" : 
                                  order.status === 'Processing' ? "bg-primary text-white" :
                                  order.status === 'Shipped' ? "bg-primary/20 text-primary" : "bg-red-50 text-red-500"
                                )}>
                                  {order.status === 'Delivered' && <CheckCircle2 size={12} />}
                                  {order.status === 'Processing' && <Clock size={12} />}
                                  {order.status === 'Cancelled' && <AlertCircle size={12} />}
                                  {order.status}
                                </span>
                              </td>
                              <td className="px-10 py-6 font-display font-extrabold text-base text-primary">{order.total}</td>
                              <td className="px-10 py-6 text-right">
                                <button className="p-3 hover:bg-primary/10 hover:text-primary rounded-xl transition-all duration-300 text-on-surface/20">
                                  <MoreVertical size={20} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Products */}
                  <div className="bg-surface-container-low rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="p-10 border-b border-outline-variant/10">
                      <h3 className="font-display font-extrabold text-2xl tracking-tight">Top Selling Products</h3>
                    </div>
                    <div className="p-10 space-y-8 flex-1">
                      {PRODUCTS.slice(0, 4).map((product) => (
                        <div key={product.id} className="flex items-center gap-6 group cursor-pointer">
                          <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display font-extrabold text-sm truncate tracking-tight group-hover:text-primary transition-colors">{product.name}</h4>
                            <p className="text-[9px] text-on-surface/30 font-label font-bold uppercase tracking-[0.2em] mt-1.5">42 Sales • Rs. 32,240</p>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-label font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg shadow-sm">+15%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-10 bg-white/30 border-t border-outline-variant/10">
                      <button className="btn-secondary w-full py-4 text-sm">
                        View Inventory
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div 
                key="products"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="bg-surface-container-low rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-10 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                    <h2 className="text-4xl font-display font-extrabold tracking-tight mb-2">Product Management</h2>
                    <p className="text-on-surface/40 text-lg font-medium">Manage your inventory and product listings with precision.</p>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                      <input 
                        type="text" 
                        placeholder="Search products..." 
                        className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/10 transition-all font-bold text-sm shadow-sm group-hover:shadow-md"
                      />
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-on-surface/30 group-hover:text-primary transition-colors" size={20} />
                    </div>
                    <button className="btn-primary px-8 py-4 text-sm">
                      Add New
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/50 text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30">
                        <th className="px-10 py-6">Product</th>
                        <th className="px-10 py-6">Category</th>
                        <th className="px-10 py-6">Price</th>
                        <th className="px-10 py-6">Stock</th>
                        <th className="px-10 py-6">Status</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {PRODUCTS.map((product) => (
                        <tr key={product.id} className="hover:bg-white/50 transition-all duration-500 group">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-6">
                              <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-500">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-display font-extrabold text-base tracking-tight group-hover:text-primary transition-colors truncate max-w-60">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 text-sm font-medium text-on-surface/40 capitalize">{product.category}</td>
                          <td className="px-10 py-6 font-display font-extrabold text-lg text-primary">Rs. {formatPKRPrice(product.price)}</td>
                          <td className="px-10 py-6 text-sm font-medium text-on-surface/60">45 in stock</td>
                          <td className="px-10 py-6">
                            <span className="text-[9px] font-label font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary/10 text-primary shadow-sm">
                              Active
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <div className="flex justify-end gap-3">
                              <button className="p-3 hover:bg-primary/10 text-primary rounded-xl transition-all duration-300 shadow-sm bg-white"><Edit size={18} /></button>
                              <button className="p-3 hover:bg-red-50 text-red-500 rounded-xl transition-all duration-300 shadow-sm bg-white"><Trash2 size={18} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Admin;
