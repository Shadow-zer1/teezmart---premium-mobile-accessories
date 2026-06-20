import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Menu, X, Heart, ChevronDown, Zap, Sparkles, LayoutGrid, Truck, Phone, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useWooCategories } from '../hooks/useWooProducts';
import { getProducts } from '../services/wordpress'; // Import getProducts

const decodeHTML = (html: string) => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

// ───── Annoucment Bar ───────────────────────────────────────────────────────────────

const AnnouncementTicker = () => {
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        // We fetch by slug 'ticker-data' to match your URL
        const response = await fetch(
          'https://wordpress-production-27ad.up.railway.app/wp-json/wp/v2/pages?slug=ticker-data'
        );
        const data = await response.json();

        if (data && data.length > 0) {
          // data[0] is the page object. We take the rendered content.
          const rawHtml = data[0].content.rendered;

          // We split by '|' and clean up any empty strings or trailing spaces
          const cleanItems = rawHtml
            .split('|')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);

          setAnnouncements(cleanItems);
        }
      } catch (error) {
        console.error("Error fetching ticker data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickerData();
  }, []);

  if (isLoading || announcements.length === 0) return null;

  return (
    <div className="w-full bg-primary overflow-hidden h-10 flex items-center border-b border-white/10 select-none">
      <motion.div
        className="flex whitespace-nowrap gap-16 px-4"
        animate={{ x: [0, -1500] }}
        transition={{
          duration: 30, // Adjust speed here (higher = slower)
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Repeating items multiple times for a seamless loop */}
        {[...announcements, ...announcements, ...announcements].map((content, index) => (
          <div key={index} className="flex items-center gap-8">
            <div
              className="text-white font-bold text-[11px] md:text-xs uppercase tracking-[0.2em] ticker-content-wrapper"
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <span className="text-white/20 text-lg font-light">/</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

// ─── Search preview hook ──────────────────────────────────────────────────────
function useSearchPreview(query: string) {
  const [results, setResults] = useState<{ name: string; price: string; path: string; image?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getProducts({ search: query, per_page: 5 }); // Use getProducts
        if (res.success && res.data) {
          setResults(res.data.map((p: any) => ({
            name: decodeHTML(p.name),
            price: p.price ? `Rs. ${Math.round(parseFloat(p.price)).toLocaleString('ur-PK')}` : '', // Ensure price formatting
            path: `/product/${p.id}`,
            image: p.images?.[0]?.src,
          })));
        } else {
          setResults([{ name: `Search "${query}" in All Products`, price: '', path: `/shop?search=${encodeURIComponent(query)}` }]);
        }
      } catch {
        setResults([{ name: `Search "${query}" in All Products`, price: '', path: `/shop?search=${encodeURIComponent(query)}` }]);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);
  return { results, loading };
}

// ─── Search Dropdown ──────────────────────────────────────────────────────────
const SearchDropdown: React.FC<{ query: string; onClose: () => void; navigate: (p: string) => void }> = ({ query, onClose, navigate }) => {
  const { results, loading } = useSearchPreview(query);
  if (!query || query.length < 2) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: '16px', border: '1px solid rgba(193,198,215,0.25)', boxShadow: '0 16px 48px rgba(0,89,187,0.12)', overflow: 'hidden', zIndex: 100 }}
    >
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#191c1e60', fontSize: '13px' }}>Searching...</div>
      ) : results.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#191c1e60', fontSize: '13px' }}>No results for "{query}"</div>
      ) : (
        <div style={{ padding: '8px' }}>
          {results.map((r, i) => (
            <button key={i} onClick={() => { navigate(r.path); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '10px 12px', borderRadius: '10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,89,187,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {r.image
                ? <img src={r.image} alt={r.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(0,89,187,0.08)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Search size={16} style={{ color: '#0059bb' }} /></div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#191c1e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                {r.price && <div style={{ fontSize: '12px', color: '#0059bb', fontWeight: 700, marginTop: '2px' }}>{r.price}</div>}
              </div>
              <ArrowRight size={14} style={{ color: '#191c1e30', flexShrink: 0 }} />
            </button>
          ))}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.05)', margin: '4px 0 0', padding: '8px' }}>
            <button
              onClick={() => { navigate(`/shop?search=${encodeURIComponent(query)}`); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: 'rgba(0,89,187,0.06)', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: '#0059bb', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,89,187,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,89,187,0.06)')}
            >
              View all results for "{query}" <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ─── Mega Panel ───────────────────────────────────────────────────────────────
interface FeaturedItem { label: string; desc: string; path: string; icon: React.ElementType; accent: string }
interface MegaData { featured: FeaturedItem[]; links: { label: string; path: string }[] }

const MegaPanel: React.FC<{ mega: MegaData; onClose: () => void }> = ({ mega, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
    transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
    style={{ width: '520px' }}
  >
    <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderRadius: '20px', border: '1px solid rgba(193,198,215,0.25)', boxShadow: '0 20px 60px rgba(0,89,187,0.12), 0 4px 16px rgba(0,0,0,0.06)', padding: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${mega.featured.length}, 1fr)`, gap: '12px', marginBottom: '20px' }}>
        {mega.featured.map(f => (
          <Link key={f.path} to={f.path} onClick={onClose}
            style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: '14px', background: `${f.accent}08`, border: `1px solid ${f.accent}18`, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.background = `${f.accent}14`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${f.accent}08`)}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${f.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <f.icon size={18} style={{ color: f.accent }} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#191c1e', fontFamily: 'Lexend, sans-serif' }}>{f.label}</div>
              <div style={{ fontSize: '11px', color: '#191c1e80', marginTop: '2px' }}>{f.desc}</div>
            </div>
          </Link>
        ))}
      </div>
      <div style={{ height: '1px', background: 'rgba(0,0,0,0.06)', marginBottom: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {mega.links.map(l => (
          <Link key={l.path} to={l.path} onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, color: '#191c1eaa', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,89,187,0.06)'; e.currentTarget.style.color = '#0059bb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#191c1eaa'; }}
          >
            <ArrowRight size={12} style={{ opacity: 0.4 }} />{l.label}
          </Link>
        ))}
      </div>
    </div>
  </motion.div>
);


// ─── Navbar ───────────────────────────────────────────────────────────────────
const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);
  const [expandedMobileSub, setExpandedMobileSub] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { cartCount } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);


  useEffect(() => {
    const controlNavbar = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        // If scrolling down and past the threshold, hide it
        setIsVisible(false);
      } else {
        // If scrolling up, show it
        setIsVisible(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);


  const { categories } = useWooCategories();
  const wcCategories = categories
    .filter(c => {
      const name = decodeHTML(c.name).toLowerCase();
      return !['uncategorized', 'uncategorised', 'all products'].includes(name);
    })
    .map(c => ({ ...c, name: decodeHTML(c.name) }));

  const categoryLinks = [
    { label: 'All Products', path: '/shop' },
    ...wcCategories.map(c => ({ label: c.name, path: `/shop?category=${c.id}` })),
  ];

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setActiveMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleEnter = (label: string) => { clearTimeout(leaveTimer.current); setActiveMenu(label); };
  const handleLeave = () => { leaveTimer.current = setTimeout(() => setActiveMenu(null), 150); };

  const NAV_ITEMS = [
    { label: 'Home', path: '/' },
    {
      label: 'Shop',
      mega: {
        featured: [
          { label: 'Flash Sale', desc: 'Up to 30% off', path: '/flash-sale', icon: Zap, accent: '#ff4d4d' },
          { label: 'New Arrivals', desc: 'Fresh drops', path: '/new-arrivals', icon: Sparkles, accent: '#0059bb' },
          { label: 'Categories', desc: 'Browse all types', path: '/categories', icon: LayoutGrid, accent: '#7c3aed' },
        ],
        links: categoryLinks,
      },
    },
    { label: 'Track Order', path: '/track-order' },
    { label: 'About', path: '/about' },
    {
      label: 'Support',
      mega: {
        featured: [
          { label: 'Contact Us', desc: 'Get in touch', path: '/contact', icon: Phone, accent: '#0059bb' },
          { label: 'FAQs', desc: 'Quick answers', path: '/faq', icon: HelpCircle, accent: '#059669' },
          { label: 'Track Order', desc: 'Where is my order?', path: '/track-order', icon: Truck, accent: '#d97706' },
        ],
        links: [
          { label: 'Shipping Policy', path: '/shipping-policy' },
          { label: 'Returns & Refunds', path: '/returns-policy' },
          { label: 'Privacy Policy', path: '/privacy-policy' },
          { label: 'About Us', path: '/about' },
        ],
      },
    },
  ];

  // Mobile menu: Shop has fixed links + a "Categories" sub-sub item with WC cats
  const MOBILE_MENU = [
    { label: 'Home', path: '/' },
    {
      label: 'Shop',
      children: [
        { label: 'All Products', path: '/shop' },
        { label: 'Flash Sale', path: '/flash-sale' },
        { label: 'New Arrivals', path: '/new-arrivals' },
        // 'Categories' is a special nested group — handled separately below
      ],
    },
    { label: 'Track Order', path: '/track-order' },
    { label: 'About', path: '/about' },
    {
      label: 'Support',
      children: [
        { label: 'Contact Us', path: '/contact' },
        { label: 'FAQs', path: '/faq' },
        { label: 'Shipping Policy', path: '/shipping-policy' },
        { label: 'Returns & Refunds', path: '/returns-policy' },
        { label: 'Privacy Policy', path: '/privacy-policy' },
      ],
    },
  ];

  const linkStyle = (active = false): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 16px', borderRadius: '10px',
    fontSize: '14px', fontWeight: 600,
    color: active ? '#0059bb' : '#191c1e99',
    textDecoration: 'none', transition: 'all 0.15s',
    background: active ? 'rgba(0,89,187,0.05)' : 'transparent',
  });

  const mobileMenu = ReactDOM.createPortal(
    <AnimatePresence>
      {isMenuOpen && (
        <>
          <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          />
          <motion.div key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '82vw', maxWidth: '360px', zIndex: 9999, background: 'rgba(247,249,251,0.97)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,89,187,0.14)', borderLeft: '1px solid rgba(193,198,215,0.2)' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', height: '72px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-tertiary rounded-lg flex items-center justify-center shadow-ambient">
                  <span className="text-white font-bold text-lg font-display">T</span>
                </div>
                <span className="text-lg font-display font-extrabold tracking-tighter text-on-surface">TeezMart</span>
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-on-surface/60 hover:text-primary transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Links */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {MOBILE_MENU.map(item => (
                <div key={item.label} style={{ marginBottom: '4px' }}>
                  {'children' in item ? (
                    <>
                      {/* Level 1 accordion button */}
                      <button
                        onClick={() => {
                          setExpandedMobile(expandedMobile === item.label ? null : item.label);
                          setExpandedMobileSub(null);
                        }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 16px', borderRadius: '12px', border: 'none', background: expandedMobile === item.label ? 'rgba(0,89,187,0.06)' : 'transparent', cursor: 'pointer' }}
                      >
                        <span className="text-lg font-display font-bold text-on-surface">{item.label}</span>
                        <motion.div animate={{ rotate: expandedMobile === item.label ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={18} style={{ color: '#191c1e60' }} />
                        </motion.div>
                      </button>

                      {/* Level 1 children */}
                      <AnimatePresence>
                        {expandedMobile === item.label && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden', paddingLeft: '12px' }}>

                            {/* Static child links */}
                            {item.children.map(child => (
                              <Link key={child.path} to={child.path} onClick={() => setIsMenuOpen(false)} style={linkStyle()}
                                onMouseEnter={e => { e.currentTarget.style.color = '#0059bb'; e.currentTarget.style.background = 'rgba(0,89,187,0.05)'; }}
                                onMouseLeave={e => { e.currentTarget.style.color = '#191c1e99'; e.currentTarget.style.background = 'transparent'; }}
                              >
                                <ArrowRight size={12} style={{ opacity: 0.4 }} />{child.label}
                              </Link>
                            ))}

                            {/* Categories sub-sub menu — only under Shop */}
                            {item.label === 'Shop' && (
                              <div style={{ marginTop: '4px' }}>
                                <button
                                  onClick={() => setExpandedMobileSub(expandedMobileSub === 'Categories' ? null : 'Categories')}
                                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '10px 16px', borderRadius: '10px', border: 'none', background: expandedMobileSub === 'Categories' ? 'rgba(124,58,237,0.06)' : 'transparent', cursor: 'pointer' }}
                                >
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: expandedMobileSub === 'Categories' ? '#7c3aed' : '#191c1e99' }}>
                                    <LayoutGrid size={14} style={{ opacity: 0.6 }} />
                                    Categories
                                  </span>
                                  <motion.div animate={{ rotate: expandedMobileSub === 'Categories' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                    <ChevronDown size={14} style={{ color: '#191c1e60' }} />
                                  </motion.div>
                                </button>

                                {/* Sub-sub: WooCommerce categories */}
                                <AnimatePresence>
                                  {expandedMobileSub === 'Categories' && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden', paddingLeft: '16px' }}>
                                      <Link to="/categories" onClick={() => setIsMenuOpen(false)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#7c3aed', textDecoration: 'none', marginBottom: '4px' }}
                                      >
                                        View All Categories →
                                      </Link>
                                      {wcCategories.length === 0 ? (
                                        <div style={{ padding: '8px 16px', fontSize: '13px', color: '#191c1e50' }}>Loading...</div>
                                      ) : (
                                        wcCategories.map(cat => (
                                          <Link key={cat.id} to={`/shop?category=${cat.id}`} onClick={() => setIsMenuOpen(false)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#191c1e80', textDecoration: 'none', transition: 'all 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.background = 'rgba(124,58,237,0.05)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#191c1e80'; e.currentTarget.style.background = 'transparent'; }}
                                          >
                                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7c3aed', opacity: 0.5, flexShrink: 0 }} />
                                            {cat.name}
                                          </Link>
                                        ))
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  ) : (
                    <Link to={item.path!} onClick={() => setIsMenuOpen(false)}
                      style={{ display: 'block', padding: '14px 16px', borderRadius: '12px', fontSize: '18px', fontWeight: 800, color: '#191c1e', textDecoration: 'none', fontFamily: 'Lexend, sans-serif', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#0059bb'; e.currentTarget.style.background = 'rgba(0,89,187,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#191c1e'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                to={isAuthenticated ? "/account" : "/account"}
                onClick={() => setIsMenuOpen(false)}
                className="btn-primary w-full py-4 text-sm text-center flex items-center justify-center rounded-2xl"
              >
                {isAuthenticated ? `Hi, ${user?.display_name || user?.username || user?.email?.split('@')[0] || 'User'}` : 'Login / Sign Up'}
              </Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="btn-secondary w-full py-3 text-sm text-center flex items-center justify-center gap-2 rounded-2xl">
                <ShoppingCart size={16} /> View Cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      <header
        className={`sticky top-0 w-full z-100 flex flex-col transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
          }`}
      >
        <AnnouncementTicker />
        <nav className="glass-nav border-b border-outline-variant/10" ref={navRef}>
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">

              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 group shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-tertiary rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform shadow-ambient">
                  <span className="text-white font-bold text-2xl font-display">T</span>
                </div>
                <span className="text-2xl font-display font-extrabold tracking-tighter text-on-surface">TeezMart</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden lg:flex items-center gap-1">
                {NAV_ITEMS.map(item => (
                  <div key={item.label} className="relative"
                    onMouseEnter={() => 'mega' in item && handleEnter(item.label)}
                    onMouseLeave={handleLeave}
                  >
                    {'path' in item ? (
                      <Link to={item.path!} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold text-on-surface/70 hover:text-primary hover:bg-surface-container-low transition-all">
                        {item.label}
                      </Link>
                    ) : (
                      <button className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{ color: activeMenu === item.label ? '#0059bb' : '#191c1eaa', background: activeMenu === item.label ? 'rgba(0,89,187,0.06)' : 'transparent', border: 'none', cursor: 'pointer' }}
                      >
                        {item.label}
                        <motion.div animate={{ rotate: activeMenu === item.label ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={14} />
                        </motion.div>
                      </button>
                    )}
                    <AnimatePresence>
                      {'mega' in item && activeMenu === item.label && (
                        <MegaPanel mega={item.mega} onClose={() => setActiveMenu(null)} />
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              {/* Icons */}
              <div className="flex items-center gap-1">
                <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-on-surface/70">
                  <Search size={20} />
                </button>
                <Link to="/wishlist" className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors hidden sm:flex text-on-surface/70 relative">
                  <Heart size={20} />
                  {wishlistCount > 0 && <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlistCount}</span>}
                </Link>
                <Link to="/account" className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-on-surface/70 hidden sm:flex">
                  <div className="flex items-center gap-2">
                    <User size={20} />
                    {isAuthenticated && (
                      <span className="text-xs font-bold text-primary">
                        {/* We try Display Name first, then Username, then fallback to Email but split it at the @ */}
                        {user?.display_name || user?.username || user?.email?.split('@')[0] || 'User'}
                      </span>
                    )}
                  </div>
                </Link>
                <Link to="/cart" className="p-2.5 hover:bg-surface-container-low rounded-full transition-colors relative text-on-surface/70">
                  <ShoppingCart size={20} />
                  {cartCount > 0 && <span className="absolute top-1 right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}
                </Link>
                <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2.5 hover:bg-surface-container-low rounded-full transition-colors text-on-surface/70">
                  <Menu size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="border-b border-outline-variant/10 overflow-visible"
                style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)' }}
              >
                <div className="max-w-3xl mx-auto px-6 py-4" style={{ position: 'relative' }}>
                  <form className="relative" onSubmit={e => { e.preventDefault(); navigate(`/shop?search=${encodeURIComponent(searchTerm)}`); setIsSearchOpen(false); setSearchTerm(''); }}>
                    <input type="text" placeholder="Search cases, chargers, accessories..."
                      className="w-full pl-12 pr-12 py-4 bg-surface-container-low border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none font-medium"
                      autoFocus value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={18} />
                    {searchTerm && (
                      <button type="button" onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40 hover:text-on-surface/70 transition-colors">
                        <X size={16} />
                      </button>
                    )}
                  </form>
                  <AnimatePresence>
                    {searchTerm.length >= 2 && (
                      <SearchDropdown query={searchTerm} onClose={() => { setIsSearchOpen(false); setSearchTerm(''); }} navigate={navigate} />
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>
      {mobileMenu}
    </>
  );
};

export default Navbar;