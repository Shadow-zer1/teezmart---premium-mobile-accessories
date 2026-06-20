import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, SlidersHorizontal, Grid, List as ListIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWooProducts, useWooCategories } from '../hooks/useWooProducts';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { cn } from '../lib/utils';

const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('search') || ''; // Get search query from URL
  const [sortBy, setSortBy] = useState('relevance');
  const { cart } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter states
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Map sort values to WooCommerce orderby
  const getOrderBy = (sort: string): { orderby: 'date' | 'price' | 'rating' | 'popularity', order: 'asc' | 'desc' } => {
    switch (sort) {
      case 'price-low': return { orderby: 'price', order: 'asc' };
      case 'price-high': return { orderby: 'price', order: 'desc' };
      case 'rating': return { orderby: 'rating', order: 'desc' };
      default: return { orderby: 'date', order: 'desc' as const };
    }
  };

  // helper function 
  const decodeHTML = (html: string) => {
    if (!html) return '';
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };


  const { orderby, order } = getOrderBy(sortBy);
  // When no category is selected, categoryId is undefined, which means the API will return ALL products 
  // including uncategorized products (uncategorized = show all)
  const categoryId = categoryFilter ? parseInt(categoryFilter) : undefined;

  // Fetch products dynamically from WordPress
  const { products = [], isLoading = true, error = null } = useWooProducts({
    page: 1,
    per_page: 20,
    search: searchQuery, // Pass search query to the hook
    category: categoryId,
    orderby: orderby,
    order: order,
    autoFetch: true
  }) || {};

  // Fetch categories and rename "Uncategorized" to "All"
  const { categories: allCategories = [] } = useWooCategories() || {};
  const categories = useMemo(() =>
    allCategories
      .map(cat => {
        if (['uncategorized', 'uncategorised'].includes(cat.name.toLowerCase())) {
          return { ...cat, name: 'All' };
        }
        return cat;
      })
      .sort((a, b) => (a.name === 'All' ? -1 : b.name === 'All' ? 1 : 0)),
    [allCategories]
  );

  // Extract available colors and models from products
  const { colors: availableColors, models: availableModels } = useMemo(() => {
    const colorSet = new Set<string>();
    const modelSet = new Set<string>();

    products.forEach(product => {
      if (product.attributes) {
        product.attributes.forEach(attr => {
          if (attr.name.toLowerCase().includes('color')) {
            attr.options.forEach(option => colorSet.add(option));
          }
          if (attr.name.toLowerCase().includes('model') ||
            attr.name.toLowerCase().includes('device') ||
            attr.name.toLowerCase().includes('variant')) {
            attr.options.forEach(option => modelSet.add(option));
          }
        });
      }
    });

    return {
      colors: Array.from(colorSet).sort(),
      models: Array.from(modelSet).sort(),
    };
  }, [products]);

  // Apply all filters to products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Price filter
      const price = parseFloat(product.price);
      if (price < priceRange[0] || price > priceRange[1]) return false;

      // Rating filter
      if (selectedRating !== null) {
        const rating = Math.floor(parseFloat(product.average_rating || '0'));
        if (rating < selectedRating) return false;
      }

      // Color filter
      if (selectedColors.length > 0) {
        const hasColor = product.attributes?.some(attr => {
          if (attr.name.toLowerCase().includes('color')) {
            return selectedColors.some(color => attr.options.includes(color));
          }
          return false;
        });
        if (!hasColor) return false;
      }

      // Model filter
      if (selectedModels.length > 0) {
        const hasModel = product.attributes?.some(attr => {
          if (attr.name.toLowerCase().includes('model') ||
            attr.name.toLowerCase().includes('device') ||
            attr.name.toLowerCase().includes('variant')) {
            return selectedModels.some(model => attr.options.includes(model));
          }
          return false;
        });
        if (!hasModel) return false;
      }

      return true;
    });
  }, [products, priceRange, selectedRating, selectedColors, selectedModels]);

  const handleCategoryChange = (id: string) => {
    const category = allCategories.find(c => c.id.toString() === id);
    const isUncategorized = category && ['uncategorized', 'uncategorised'].includes(category.name.toLowerCase());
    if (id === 'all' || isUncategorized) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', id);
    }
    setSearchParams(searchParams);
  };

  const selectedCategoryName = searchQuery
    ? `Search results for "${searchQuery}"`
    : categoryFilter
      ? decodeHTML(categories.find(c => c.id.toString() === categoryFilter)?.name || '')
      : 'All Products';

  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-20">
        <div>
          <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-3 block">Premium Accessories</span>
          <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-4">
            {selectedCategoryName}
          </h1>
          <p className="text-on-surface/50 font-medium">
            {isLoading ? 'Loading products...' : `Showing ${filteredProducts.length} results`}
          </p>
        </div>

        <div className="flex items-center gap-6 w-full md:w-auto overflow-x-auto pb-4 md:pb-0">
          <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2.5 rounded-lg transition-all duration-300",
                viewMode === 'grid' ? "bg-white shadow-ambient text-primary" : "text-on-surface/30 hover:text-on-surface/60"
              )}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2.5 rounded-lg transition-all duration-300",
                viewMode === 'list' ? "bg-white shadow-ambient text-primary" : "text-on-surface/30 hover:text-on-surface/60"
              )}
            >
              <ListIcon size={20} />
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-surface-container-low border-none rounded-xl px-6 py-3 text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer appearance-none min-w-45"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="btn-primary flex items-center gap-3 px-8 py-3.5 text-sm"
          >
            <SlidersHorizontal size={18} />
            Filters</button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-3 mb-16 overflow-x-auto pb-4 no-scrollbar bg-surface-container-low/50 p-4 rounded-2xl border border-outline-variant/5">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id.toString())}
            className={cn(
              "px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all text-sm",
              categoryFilter === cat.id.toString() || (!categoryFilter && cat.name === 'All')
                ? "bg-primary text-white shadow-ambient"
                : "bg-surface-container-low text-on-surface hover:bg-surface-container"
            )}
          >
            {/* Wrap name in decodeHTML */}
            {decodeHTML(cat.name)}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center mb-8">
          <p className="text-red-600 font-semibold mb-4">Failed to load products</p>
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <details className="text-left text-sm text-red-400">
            <summary className="cursor-pointer font-semibold mb-2">Technical Details</summary>
            <code className="block bg-red-100 p-2 rounded mt-2 overflow-auto">{error}</code>
          </details>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
        {/* Filters Sidebar */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-1 bg-surface-container-low rounded-2xl p-8 h-fit sticky top-28"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-display font-extrabold">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="lg:hidden text-on-surface/40 hover:text-on-surface/60">
                  <X size={20} />
                </button>
              </div>

              {/* Price Range Filter */}
              <div className="mb-8 pb-8 border-b border-outline-variant/10">
                <h4 className="font-bold text-sm mb-4 text-on-surface/60">Price Range</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/30 block mb-2">Min Price</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface/30">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full bg-white pl-8 pr-3 py-3 rounded-xl text-sm font-bold outline-none border border-outline-variant/10 focus:border-primary/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Min"
                      />
                    </div>
                  </div>
                  <div className="w-4 h-px bg-outline-variant/20 mt-6" />
                  <div className="flex-1">
                    <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/30 block mb-2">Max Price</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface/30">Rs.</span>
                      <input
                        type="number"
                        min="0"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 0])}
                        className="w-full bg-white pl-8 pr-3 py-3 rounded-xl text-sm font-bold outline-none border border-outline-variant/10 focus:border-primary/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-8 pb-8 border-b border-outline-variant/10">
                <h4 className="font-bold text-sm mb-4 text-on-surface/60">Rating</h4>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all text-sm",
                        selectedRating === rating
                          ? "bg-primary text-white"
                          : "hover:bg-white"
                      )}
                    >
                      <span className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={cn(
                            "text-xs",
                            i < rating ? "text-yellow-400" : "text-on-surface/20"
                          )}>★</span>
                        ))}
                      </span>
                      <span>{rating}+ Stars</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Filter */}
              {availableColors.length > 0 && (
                <div className="mb-8 pb-8 border-b border-outline-variant/10">
                  <h4 className="font-bold text-sm mb-4 text-on-surface/60">Color</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColors(
                          selectedColors.includes(color)
                            ? selectedColors.filter(c => c !== color)
                            : [...selectedColors, color]
                        )}
                        className={cn(
                          "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                          selectedColors.includes(color)
                            ? "bg-primary text-white"
                            : "bg-white text-on-surface hover:bg-primary/10"
                        )}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Model Filter */}
              {availableModels.length > 0 && (
                <div className="mb-8">
                  <h4 className="font-bold text-sm mb-4 text-on-surface/60">Model</h4>
                  <div className="space-y-2">
                    {availableModels.map((model) => (
                      <label key={model} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model)}
                          onChange={(e) => setSelectedModels(
                            e.target.checked
                              ? [...selectedModels, model]
                              : selectedModels.filter(m => m !== model)
                          )}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{model}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Reset Filters */}
              {(priceRange[0] > 0 || priceRange[1] < 10000 || selectedRating || selectedColors.length > 0 || selectedModels.length > 0) && (
                <button
                  onClick={() => {
                    setPriceRange([0, 10000]);
                    setSelectedRating(null);
                    setSelectedColors([]);
                    setSelectedModels([]);
                  }}
                  className="w-full mt-8 px-6 py-3 bg-on-surface/10 text-on-surface/60 hover:text-on-surface rounded-xl font-bold text-sm transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-on-surface/50">Loading products...</p>
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-on-surface/50 text-lg">No products match your filters</p>
              <button
                onClick={() => {
                  setPriceRange([0, 10000]);
                  setSelectedRating(null);
                  setSelectedColors([]);
                  setSelectedModels([]);
                }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <motion.div
              layout
              className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  : "space-y-4"
              )}
            >
              <AnimatePresence>
                {filteredProducts.map((product, index) => {
                  const isAlreadyInCart = cart.some(item => item.id === product.id.toString());
                  const canAddToCart = product.stock_status !== 'outofstock' && !(product.sold_individually && isAlreadyInCart);

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {viewMode === 'grid' ? (
                        <ProductCard product={product} />
                      ) : (
                        <div className="flex gap-6 bg-surface-container-low rounded-2xl overflow-hidden hover:shadow-ambient transition-all p-6 relative">
                          {product.images[0] && (
                            <img
                              src={product.images[0].src}
                              alt={product.name}
                              className="w-24 h-24 object-cover rounded-lg shrink-0"
                            />
                          )}
                          <div className="grow">
                            <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                            <p className="text-on-surface/50 text-sm mb-4 line-clamp-2">{product.short_description?.replace(/<[^>]*>/g, '')}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-primary">Rs. {parseFloat(product.price).toLocaleString('ur-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                {product.regular_price && product.price !== product.regular_price && (
                                  <span className="text-sm line-through text-on-surface/40">Rs. {parseFloat(product.regular_price).toLocaleString('ur-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                                )}
                              </div>
                              <button
                                disabled={!canAddToCart}
                                className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                              >
                                {!canAddToCart ? (product.stock_status === 'outofstock' ? 'Out of Stock' : 'In Cart') : 'Add to Cart'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;