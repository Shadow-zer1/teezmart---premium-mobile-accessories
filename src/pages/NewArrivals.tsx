import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useWooProducts } from '../hooks/useWooProducts';
import ProductCard from '../components/ProductCard';

const NewArrivals: React.FC = () => {
  const { products, isLoading } = useWooProducts({ 
    per_page: 20,
    orderby: 'date',
    order: 'desc',
    autoFetch: true 
  });

  return (
    <div className="pb-32">
      <section className="bg-surface-container-low py-24 px-8 border-b border-outline-variant/5">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm mb-8"
          >
            <Sparkles className="text-primary" size={18} />
            <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px]">Just Dropped</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-extrabold tracking-tight mb-8"
          >
            New Arrivals
          </motion.h1>
          <p className="text-on-surface/40 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Be the first to get your hands on the latest tech gear and premium protection for the newest devices.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/5] bg-surface-container-low animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewArrivals;