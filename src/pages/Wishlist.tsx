import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2, Loader2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useWooProducts } from '../hooks/useWooProducts';
import { Product } from '../types';

const Wishlist: React.FC = () => {
  const { wishlist, clearWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const wishlistItems = wishlist;

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-32 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-32 h-32 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm text-primary/20">
            <User size={56} />
          </div>
          <h1 className="text-5xl font-display font-extrabold tracking-tight mb-6">Sign In Required</h1>
          <p className="text-on-surface/40 font-medium mb-12 leading-relaxed">
            Please sign in to view your saved items and sync your wishlist across all your devices.
          </p>
          <Link to="/account" className="btn-primary inline-flex items-center gap-3 px-12 py-5 text-lg">
            Sign In to Account <ArrowRight size={24} />
          </Link>
        </motion.div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-24 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <div className="w-32 h-32 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-10 shadow-sm">
            <Heart size={56} className="text-on-surface/20" />
          </div>
          <h1 className="text-5xl font-display font-extrabold tracking-tight mb-6">Your wishlist is empty</h1>
          <p className="text-on-surface/40 font-medium mb-12 leading-relaxed">Save items you love to your wishlist and they'll appear here for easy access later. Curate your perfect collection.</p>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-3 px-12 py-5 text-lg">
            Explore Products <ArrowRight size={24} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-4 block">Saved Items</span>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-4">My Wishlist</h1>
          <p className="text-on-surface/40 font-medium">You have {wishlistItems.length} items saved in your collection.</p>
        </div>
        <button 
          onClick={clearWishlist}
          className="text-xs font-label font-bold text-primary hover:text-primary/80 flex items-center gap-2 uppercase tracking-widest transition-all group"
        >
          <Trash2 size={18} className="group-hover:scale-110 transition-transform" /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
        <AnimatePresence>
          {wishlistItems.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Recommendations */}
      <section className="mt-32">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-display font-extrabold tracking-tight mb-4">Recommended for You</h2>
            <p className="text-on-surface/40 font-medium">Based on your interests and saved items.</p>
          </div>
          <Link to="/shop" className="text-xs font-label font-bold text-primary flex items-center gap-3 hover:gap-5 uppercase tracking-widest transition-all">
            Shop All <ArrowRight size={20} />
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          <RecommendedProducts />
        </div>
      </section>
    </div>
  );
};

// Component to fetch and display recommended products
const RecommendedProducts: React.FC = () => {
  const { products, isLoading } = useWooProducts({ per_page: 4, orderby: 'popularity', order: 'desc', autoFetch: true });
  if (isLoading) return <div className="col-span-full text-center py-8"><Loader2 size={24} className="animate-spin mx-auto" /></div>;
  return (
    <>
      {products.map((product: Product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </>
  );
};

export default Wishlist;
