import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Heart } from 'lucide-react';
import { subscribeToNewsletter } from '../services/newsletter';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setErrorMessage('');

    const result = await subscribeToNewsletter(email);
    if (result.success) {
      setStatus('success');
      setEmail('');
    } else {
      setStatus('error');
      setErrorMessage(result.message || 'Subscription failed.');
    }
  };

  return (
    <footer className="bg-surface-container-low pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
          {/* Brand */}
          <div className="space-y-10">
            <Link to="/" className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-tertiary rounded-2xl flex items-center justify-center shadow-ambient group-hover:scale-110 transition-all duration-500">
                <span className="text-white font-display font-extrabold text-2xl">T</span>
              </div>
              <span className="text-3xl font-display font-extrabold tracking-tighter group-hover:text-primary transition-colors">TeezMart</span>
            </Link>
            <p className="text-on-surface/40 text-base font-medium leading-relaxed max-w-xs">
              Premium mobile accessories for those who value quality and style. We bring you the best in protection and functionality.
            </p>
            <div className="flex gap-6">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-on-surface/40 hover:bg-primary hover:text-white hover:shadow-ambient transition-all duration-500">
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-extrabold text-xl mb-10 tracking-tight">Quick Links</h4>
            <ul className="space-y-5 text-base font-medium text-on-surface/40">
              <li><Link to="/shop" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Shop All</Link></li>
              <li><Link to="/categories" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Categories</Link></li>
              <li><Link to="/flash-sale" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Flash Sale</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> New Arrivals</Link></li>
              <li><Link to="/track-order" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Track Order</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-extrabold text-xl mb-10 tracking-tight">Support</h4>
            <ul className="space-y-5 text-base font-medium text-on-surface/40">
              <li><Link to="/contact" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Contact Us</Link></li>
              <li><Link to="/faq" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> FAQs</Link></li>
              <li><Link to="/shipping-policy" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Shipping Policy</Link></li>
              <li><Link to="/returns-policy" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Returns & Refunds</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-primary transition-colors flex items-center gap-2 group"><div className="w-1.5 h-1.5 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-all" /> Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display font-extrabold text-xl mb-10 tracking-tight">Newsletter</h4>
            <p className="text-on-surface/40 text-base font-medium mb-10 leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.
            </p>
            <form className="space-y-5" onSubmit={handleSubscribe}>
              <div className="relative">
                {status === 'error' && (
                  <p className="text-red-500 text-[10px] font-bold mb-2 ml-1">{errorMessage}</p>
                )}
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full px-6 py-5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-primary/10 outline-none transition-all font-bold shadow-sm disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                className="btn-primary w-full py-5 text-lg disabled:bg-green-600 disabled:hover:bg-green-600 transition-colors"
              >
                {status === 'loading' ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : status === 'success' ? (
                  "Subscribed!"
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-12 border-t border-outline-variant/10 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-on-surface/30 text-sm font-medium flex items-center gap-1">
            © 2026 TeezMart. All rights reserved. Made with
            <Heart size={14} className="text-blue-500 fill-blue-500 inline mx-1" />
            by
            <a
              href="https://shadowworks.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors font-bold ml-1"
            >
              Ali Javaid
            </a>.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-3 items-center">
            {['EasyPaisa', 'JazzCash', 'COD', 'Local Pickup'].map((method) => (
              <span
                key={method}
                className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase border border-primary/20 transition-all duration-300"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
