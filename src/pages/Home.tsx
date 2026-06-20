import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Truck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWooProducts, useWooCategories } from '../hooks/useWooProducts';
import ProductCard from '../components/ProductCard';
import { cn } from '../lib/utils';
import { subscribeToNewsletter } from '../services/newsletter';

const decodeHTML = (html: string) => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const Home: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  // Fetch general products and categories from WordPress
  const { products = [], isLoading: productsLoading } = useWooProducts({
    page: 1,
    per_page: 20,
    autoFetch: true
  });
  const { categories = [], isLoading: categoriesLoading } = useWooCategories();

  // Fetch specific products for hero slides
  const { products: heroProducts = [] } = useWooProducts({
    per_page: 3,
    featured: true,
    orderby: 'date',
    order: 'asc',
    autoFetch: true
  });

  const displayCategories = useMemo(() => {
    const mapped = categories.map(cat => {
      const decodedName = decodeHTML(cat.name);
      if (['uncategorized', 'uncategorised'].includes(decodedName.toLowerCase())) {
        return { ...cat, name: 'All' };
      }
      return { ...cat, name: decodedName };
    });
    return [...mapped].sort((a, b) => (a.name === 'All' ? -1 : b.name === 'All' ? 1 : 0));
  }, [categories]);

  const slides = useMemo(() => {
    if (heroProducts.length > 0) {
      return heroProducts.slice(0, 3).map(p => ({
        title: decodeHTML(p.name),
        subtitle: decodeHTML(p.short_description?.replace(/<[^>]*>/g, '') || p.description?.replace(/<[^>]*>/g, '') || ''),
        image: p.images[0]?.src || "https://picsum.photos/seed/hero/1920/1080"
      }));
    }
    return [
      {
        title: "Premium Mobile Accessories",
        subtitle: "Discover our exclusive collection of high-quality cases and protection.",
        image: "https://picsum.photos/seed/hero1/1920/1080"
      },
      {
        title: "Shop Now",
        subtitle: "Browse our latest collections and find the perfect accessory.",
        image: "https://picsum.photos/seed/hero2/1920/1080"
      }
    ];
  }, [heroProducts]);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const featuredProducts = useMemo(() => products.slice(0, 4), [products]);
  const flashSaleProducts = useMemo(() => products.filter(p => p.on_sale), [products]);

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Slider */}
      <section className="relative h-[calc(100dvh-80px)] min-h-[650px] overflow-hidden bg-surface">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {/* 1. LAYERED GRADIENTS: Ensures text visibility on any image brightness */}
            <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/95 z-10" />
            <div className="absolute inset-0 bg-linear-to-r from-black/70 via-transparent to-transparent z-10" />

            <motion.img
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10 }}
              src={slides[currentSlide].image}
              alt={slides[currentSlide].title}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
            />

            {/* 2. DYNAMIC CONTENT: pt-44 ensures it clears the Top Nav/Logo on mobile devices */}
            <div className="absolute inset-0 z-20 flex items-center px-6 md:px-12 lg:px-24 pt-44 pb-20">
              <div className="w-full max-w-7xl mx-auto flex flex-col justify-end h-full">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">

                  {/* Title & Tagline Section */}
                  <div className="lg:col-span-8 space-y-6 md:space-y-8">

                    {/* RADIANT GLOW TAGLINE: Updated to White Text with Blue Glow */}
                    <motion.span
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="inline-block font-black uppercase tracking-[0.3em] text-[clamp(10px,3vw,13px)] bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg border border-primary/30 relative overflow-hidden"
                      style={{
                        // 1. Set the solid text color to White
                        color: '#FFFFFF',

                        // 2. Set the text-shadow layers to use your Primary Blue
                        // We remove the 'text-primary' Tailwind class so these style overrides take precedence.
                        textShadow: `
      0 0 5px rgba(59, 130, 246, 0.9),  /* Inner Blue Core */
      0 0 10px rgba(59, 130, 246, 0.6), /* Mid Blue Halo */
      0 0 20px rgba(59, 130, 246, 0.3)  /* Outer Blue Radiant */
    `,
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      <span className="relative z-10">New Collection 2026</span>
                      {/* Animated Shimmer Sweep */}
                      <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent skew-x-12"
                      />
                    </motion.span>

                    {/* FLUID TITLE: Responsive clamp ensures it never overlaps or hits edges */}
                    <motion.h1
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-[clamp(2.2rem,9vw,5.5rem)] font-display font-black text-white tracking-tighter leading-[0.85] drop-shadow-2xl"
                    >
                      {slides[currentSlide].title}
                    </motion.h1>

                    {/* Subtitle: Limited to 2-3 lines for clean UI */}
                    <motion.p
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="text-base md:text-xl lg:text-2xl text-white/70 max-w-2xl font-medium leading-relaxed"
                    >
                      {slides[currentSlide].subtitle}
                    </motion.p>
                  </div>

                  {/* Buttons Section: Full width on mobile, side-by-side on desktop */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row lg:justify-end gap-4 mt-8 lg:mt-0">
                    <Link
                      to="/shop"
                      className="w-full sm:w-auto min-w-[170px] px-8 py-4 md:py-5 bg-primary text-white text-center font-bold rounded-2xl hover:scale-105 transition-all shadow-[0_0_20px_rgba(var(--color-primary),0.3)] active:scale-95"
                    >
                      Shop Now
                    </Link>
                    <Link
                      to="/categories"
                      className="w-full sm:w-auto min-w-[170px] px-8 py-4 md:py-5 bg-white/5 backdrop-blur-2xl border border-white/10 text-white text-center font-bold rounded-2xl hover:bg-white/10 transition-all active:scale-95"
                    >
                      Categories
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Indicators: Thinner and modern */}
        <div className="absolute bottom-10 right-6 md:right-12 z-30 flex flex-col gap-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "w-1 transition-all duration-700 rounded-full",
                currentSlide === i ? "h-12 bg-primary shadow-[0_0_10px_rgba(var(--color-primary),0.8)]" : "h-4 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On all orders over Rs. 5,000" },
            { icon: RefreshCw, title: "Easy Returns", desc: "14-day return policy" },
            { icon: Shield, title: "Secure Payment", desc: "100% secure checkout" },
            { icon: Zap, title: "Fast Delivery", desc: "5-7 business days" }
          ].map((feature, i) => (
            <div key={i} className="flex gap-6 items-start group">
              <div className="w-14 h-14 bg-surface-container-low text-primary rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                <feature.icon size={24} />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-on-surface/50 leading-relaxed">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      {!categoriesLoading && displayCategories.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-[10px] mb-3 block">Boutique Selection</span>
              <h2 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight">Shop by Category</h2>
            </div>
            <Link to="/categories" className="hidden md:flex items-center gap-3 text-primary font-bold hover:gap-5 transition-all">
              Explore All <ArrowRight size={24} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayCategories.slice(0, 6).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/shop?category=${category.id}`}
                  className="group block relative h-80 rounded-2xl overflow-hidden bg-surface-container-low shadow-sm hover:shadow-xl transition-all"
                >
                  {category.image && (
                    <img
                      src={category.image.src}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                      loading="eager"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex flex-col justify-end p-8">
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Flash Sale Section */}
      {flashSaleProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="relative h-96 rounded-2xl overflow-hidden group shadow-xl">
            <motion.img
              initial={{ scale: 1.05 }}
              whileHover={{ scale: 1 }}
              src={flashSaleProducts[0].images[0]?.src || "https://picsum.photos/seed/sale/1200/500"}
              alt="Flash Sale"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-r from-primary/90 via-primary/40 to-transparent flex items-center px-12 lg:px-24">
              <div>
                <span className="text-white font-bold uppercase tracking-[0.2em] text-sm mb-4 block">Limited Time Offer</span>
                <h2 className="text-5xl md:text-7xl font-display font-extrabold text-white mb-8 leading-tight">Flash Sale</h2>
                <p className="text-white/80 text-xl mb-12 max-w-xl">
                  Save up to {Math.round(((parseFloat(flashSaleProducts[0].regular_price) - parseFloat(flashSaleProducts[0].price)) / parseFloat(flashSaleProducts[0].regular_price)) * 100) || 30}% on selected items.
                </p>
                <Link to="/shop" className="bg-white text-primary inline-block px-12 py-4 font-bold rounded-xl hover:bg-gray-100 transition-colors">
                  Shop Sale Now <ArrowRight className="inline ml-3" size={20} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {!productsLoading && featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-[10px] mb-3 block">CURATED COLLECTION</span>
              <h2 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight">Featured Products</h2>
            </div>
            <Link to="/shop" className="hidden md:flex items-center gap-3 text-primary font-bold hover:gap-5 transition-all">
              View All <ArrowRight size={24} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Loading State */}
      {(productsLoading || categoriesLoading) && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Newsletter */}
      <section className="max-w-7xl mx-auto px-8 lg:px-12 py-24">
        <div className="bg-primary text-white rounded-3xl p-16 md:p-24 text-center shadow-2xl">
          <h2 className="text-5xl font-display font-extrabold mb-6">Stay Updated</h2>
          <p className="text-white/80 text-lg mb-12 max-w-2xl mx-auto">Subscribe for exclusive offers, new product launches, and styling tips.</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <div className="grow">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === 'loading' || status === 'success'}
                className="w-full px-6 py-4 rounded-xl bg-white/10 border-2 border-white/20 text-white placeholder:text-white/60 outline-none focus:border-white transition-all disabled:opacity-50"
              />
              {status === 'error' && <p className="text-red-200 text-xs mt-2 text-left">{errorMessage}</p>}
            </div>
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-surface-container-low transition-colors h-fit disabled:bg-green-100 disabled:text-green-600"
            >
              {status === 'loading' ? '...' : status === 'success' ? 'Subscribed!' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Home;