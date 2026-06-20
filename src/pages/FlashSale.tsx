import React, { useMemo } from 'react';
import { Zap, Timer } from 'lucide-react';
import { motion } from 'motion/react';
import { useWooProducts } from '../hooks/useWooProducts';
import ProductCard from '../components/ProductCard';

const FlashSale: React.FC = () => {
  const { products, isLoading } = useWooProducts({ 
    per_page: 100,
    autoFetch: true 
  });

  const saleProducts = useMemo(() => 
    products.filter(p => p.on_sale), 
  [products]);

  return (
    <div className="pb-32">
      <section className="bg-primary text-white py-24 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <Zap className="fill-white" size={32} />
            <span className="font-label font-bold uppercase tracking-[0.3em] text-xs">Limited Time Deals</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-extrabold tracking-tight mb-8"
          >
            Flash Sale
          </motion.h1>
          <p className="text-white/70 text-xl max-w-2xl font-medium">
            Unbeatable prices on premium protection and accessories. Grab them before they're gone!
          </p>
        </div>
        <Timer size={300} className="absolute -bottom-20 -right-20 text-white/5 rotate-12" />
      </section>

      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-on-surface/40 font-bold">Hunting for deals...</p>
          </div>
        ) : saleProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {saleProducts.map((product, index) => (
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
        ) : (
          <div className="text-center py-32 bg-surface-container-low rounded-[40px]">
            <h3 className="text-2xl font-display font-bold mb-2">No active sales</h3>
            <p className="text-on-surface/40">Check back later for new limited-time offers.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashSale;