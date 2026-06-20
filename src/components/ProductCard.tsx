import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import type { Product } from '../types';
import type { WooProduct } from '../services/wordpress';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { cn } from '../lib/utils';

type ProductType = Product | WooProduct;

const isWooProduct = (p: ProductType): p is WooProduct => 'sku' in p;

interface ProductCardProps {
  product: ProductType;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className }) => {
  const { cart, addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isFavorite = isInWishlist(String(product.id));
  const navigate = useNavigate();
  const productSlug = isWooProduct(product) ? product.slug : ((product as any).slug || String(product.id));
  const productId = String(product.id);

  // Memoize the product data transformation to avoid recalculating on every render
  const { cartProduct, isInStock, canAddToCart } = useMemo(() => {
    const isWoo = 'sku' in product;
    const p = product as any;
    const currentPrice = isWoo ? parseFloat(p.price) : p.price;
    const regPrice = isWoo ? parseFloat(p.regular_price || p.price) : p.originalPrice;
    
    const transformed: Product = {
      id: productId,
      slug: isWoo ? p.slug : (p.slug || productId),
      name: p.name,
      price: currentPrice,
      originalPrice: regPrice,
      image: isWoo ? (p.images?.[0]?.src || "") : p.image,
      category: isWoo ? (p.categories?.[0]?.slug || 'general') : p.category,
      description: isWoo ? (p.short_description?.replace(/<[^>]*>/g, '') || '') : p.description,
      rating: isWoo ? parseFloat(p.average_rating || '0') : p.rating,
      reviews: isWoo ? p.rating_count : p.reviews,
      isFlashSale: isWoo ? p.on_sale : p.isFlashSale,
      discount: regPrice > currentPrice ? Math.round(((regPrice - currentPrice) / regPrice) * 100) : 0
    };

    const stockStatus = isWoo ? p.stock_status !== 'outofstock' : true;
    const soldIndividually = isWoo ? p.sold_individually : false;
    const inCart = cart.some(item => item.id === productId);

    return {
      cartProduct: transformed,
      isInStock: stockStatus,
      canAddToCart: stockStatus && !(soldIndividually && inCart)
    };
  }, [product, cart, productId]);

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAuthenticated) {
      toggleWishlist(cartProduct);
    } else {
      navigate('/account');
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      onClick={() => navigate(`/product/${productSlug}`)}
      className={cn("group card-atrium overflow-visible cursor-pointer", className)}
    >
      {/* Image Container */}
      <div className="relative aspect-4/5 bg-surface-container-low rounded-lg m-3 mb-0 overflow-hidden">
        <motion.img
          src={cartProduct.image}
          alt={cartProduct.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {cartProduct.isFlashSale && (
            <span className="bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-ambient">
              Sale
            </span>
          )}
          {cartProduct.discount > 0 && (
            <span className="bg-on-surface text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              -{cartProduct.discount}%
            </span>
          )}
        </div>

        {/* Stock Status */}
        {isWooProduct(product) && !isInStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Out of Stock</span>
          </div>
        )}

        {/* Action Buttons Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <button 
            disabled={!canAddToCart}
            onClick={(e) => handleAction(e, () => addToCart(cartProduct))}
            className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-ambient hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-primary"
          >
            <ShoppingCart size={20} />
          </button>
          <button 
            onClick={handleWishlistClick}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center shadow-ambient transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75",
              isFavorite ? "bg-primary text-white" : "bg-white text-primary hover:bg-primary hover:text-white"
            )}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          <div 
            onClick={(e) => handleAction(e, () => navigate(`/product/${productSlug}`))}
            className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-ambient hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150 cursor-pointer"
          >
            <Eye size={20} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <div className="flex text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={10} fill={i < Math.floor(cartProduct.rating) ? "currentColor" : "none"} />
              ))}
            </div>
            <span className="text-[10px] font-label font-medium text-on-surface/40">({cartProduct.reviews})</span>
          </div>
          <button 
            onClick={handleWishlistClick}
            className={cn(
              "transition-colors",
              isFavorite ? "text-primary" : "text-on-surface/30 hover:text-primary"
            )}
          >
            <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
          </button>
        </div>
        
        <h3 className="font-display font-bold text-base line-clamp-1 mb-2 group-hover:text-primary transition-colors">
          {cartProduct.name}
        </h3>
        
        <div className="flex items-center gap-3">
          <span className="font-display font-extrabold text-xl text-primary">Rs. {cartProduct.price.toLocaleString('ur-PK')}</span>
          {cartProduct.originalPrice > cartProduct.price && (
            <span className="text-on-surface/30 text-sm line-through font-medium">Rs. {cartProduct.originalPrice.toLocaleString('ur-PK')}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
