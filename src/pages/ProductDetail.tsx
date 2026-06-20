import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star, ShoppingCart, Heart, Shield, Truck, RefreshCw,
  ChevronRight, Minus, Plus, Check, ArrowRight, MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useWooProducts } from '../hooks/useWooProducts';
import {
  getProductReviews,
  createProductReview,
  getProductBySlugGQL,
  type WooReview,
  type NormalizedVariation,
} from '../services/wordpress';
import ProductCard from '../components/ProductCard';
import { cn } from '../lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a Tailwind bg class (or inline gradient style string) for a color name.
 * For complex colors (Midnight, Starlight, Titanium, etc.) we return a CSS gradient.
 *
 * Usage in JSX:
 *   const style = getColorStyle(color);
 *   <div className={style.className} style={style.inlineStyle} />
 */
export function getColorStyle(colorName: string): {
  className: string;
  inlineStyle?: React.CSSProperties;
} {
  const c = colorName.toLowerCase().trim();

  // ── Complex / gradient colors ──────────────────────────────────────────────
  const gradientMap: Record<string, string> = {
    midnight:
      'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    starlight:
      'linear-gradient(135deg, #f5f5f0 0%, #e8e4d8 40%, #faf6ee 70%, #d4cfc5 100%)',
    titanium:
      'linear-gradient(135deg, #6b6b6b 0%, #9e9e9e 30%, #bdbdbd 60%, #757575 100%)',
    'space gray':
      'linear-gradient(135deg, #4a4a4a 0%, #6e6e6e 100%)',
    'sierra blue':
      'linear-gradient(135deg, #4a90d9 0%, #6aa8e0 50%, #3a7bc8 100%)',
    'alpine green':
      'linear-gradient(135deg, #4a7c59 0%, #5c9466 50%, #3d6b4a 100%)',
    'deep purple':
      'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #4c1d95 100%)',
    'product red':
      'linear-gradient(135deg, #cc0000 0%, #ff1a1a 50%, #b30000 100%)',
    'desert titanium':
      'linear-gradient(135deg, #c4a882 0%, #d4b896 50%, #b8966e 100%)',
    'natural titanium':
      'linear-gradient(135deg, #8e8e8e 0%, #b0a898 50%, #9a9080 100%)',
    'white titanium':
      'linear-gradient(135deg, #f0eeea 0%, #e8e4da 50%, #f5f3ef 100%)',
    'black titanium':
      'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 40%, #111 100%)',
    coral: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
    sunset: 'linear-gradient(135deg, #f97316 0%, #ef4444 50%, #a855f7 100%)',
    aurora: 'linear-gradient(135deg, #6ee7b7 0%, #3b82f6 50%, #9333ea 100%)',
    galaxy: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
    rainbow: 'linear-gradient(135deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff)',
    iridescent:
      'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 25%, #a1c4fd 50%, #c2e9fb 75%, #fd7043 100%)',
  };

  for (const [key, grad] of Object.entries(gradientMap)) {
    if (c.includes(key)) {
      return { className: 'rounded-full shadow-inner', inlineStyle: { background: grad } };
    }
  }

  // ── Simple Tailwind colors ─────────────────────────────────────────────────
  if (c.includes('black')) return { className: 'bg-black' };
  if (c.includes('white')) return { className: 'bg-white border border-gray-300' };
  if (c.includes('silver') || c.includes('gray') || c.includes('grey'))
    return { className: 'bg-gray-300' };
  if (c.includes('gold') || c.includes('yellow')) return { className: 'bg-yellow-500' };
  if (c.includes('rose') || c.includes('pink')) return { className: 'bg-pink-400' };
  if (c.includes('blue') || c.includes('navy') || c.includes('cobalt'))
    return { className: 'bg-blue-600' };
  if (c.includes('green') || c.includes('olive')) return { className: 'bg-green-600' };
  if (c.includes('red') || c.includes('crimson') || c.includes('scarlet'))
    return { className: 'bg-red-600' };
  if (c.includes('orange')) return { className: 'bg-orange-500' };
  if (c.includes('purple') || c.includes('violet') || c.includes('indigo'))
    return { className: 'bg-purple-600' };
  if (c.includes('brown') || c.includes('bronze') || c.includes('tan'))
    return { className: 'bg-amber-700' };
  if (c.includes('teal') || c.includes('cyan')) return { className: 'bg-teal-500' };
  if (c.includes('beige') || c.includes('cream') || c.includes('sand'))
    return { className: 'bg-amber-100 border border-amber-200' };

  // Fallback
  return { className: 'bg-gray-400' };
}

/**
 * Categorise WooCommerce attributes by convention:
 *  - "Color" (case-insensitive)  → color swatches
 *  - Starts with "#"             → pill selectors
 *  - Everything else (visible)   → specs table
 */
function normalizeAttributeValue(value: any): string {
  return String(value ?? '').toLowerCase().trim();
}

export function categoriseAttributes(attributes: any[], slugMap: Record<string, string> = {}) {
  const colorAttrs: any[] = [];
  const pillAttrs: any[] = [];
  const specAttrs: any[] = [];

  for (const attr of attributes) {
    const name = (attr.name ?? '').trim();
    const lowerName = name.toLowerCase();

    // Split comma-separated options into individual values
    const rawOptions = attr.options ?? [];
    const formattedOptions = Array.isArray(rawOptions)
      ? rawOptions.flatMap(opt => typeof opt === 'string' ? opt.split(',').map(s => s.trim()) : opt)
      : typeof rawOptions === 'string'
        ? rawOptions.split(',').map((s: string) => s.trim())
        : [];

    const processedAttr = {
      ...attr,
      slug: slugMap[name] ?? name,
      options: formattedOptions,
    };

    if (lowerName.includes('color') || lowerName.includes('colour')) {
      colorAttrs.push(processedAttr);
    }

    if (name.startsWith('#')) {
      pillAttrs.push(processedAttr);
    }

    // Show in specs if visible, regardless of # prefix
    if (attr.visible === true || String(attr.visible) === 'true') {
      specAttrs.push(processedAttr);
    }
  }
  return { colorAttrs, pillAttrs, specAttrs };
}

function buildAttributeSlugMap(attributes: any[], gqlVariations: NormalizedVariation[]): Record<string, string> {
  if (!attributes?.length || gqlVariations.length === 0) return {};

  const restAttrs = attributes.map((attr) => ({
    name: attr.name,
    options: new Set<string>(
      (Array.isArray(attr.options) ? attr.options : [])
        .flatMap((opt) => typeof opt === 'string' ? opt.split(',').map((s) => normalizeAttributeValue(s)) : [normalizeAttributeValue(opt)])
        .filter(Boolean)
    ),
  }));

  const slugOptions = new Map<string, Set<string>>();
  for (const variation of gqlVariations) {
    for (const attr of variation.attributes) {
      const slug = String(attr.name);
      const normalized = normalizeAttributeValue(attr.option);
      if (!slugOptions.has(slug)) slugOptions.set(slug, new Set());
      slugOptions.get(slug)?.add(normalized);
    }
  }

  const mapping: Record<string, string> = {};
  for (const restAttr of restAttrs) {
    let bestSlug = '';
    let bestScore = 0;

    for (const [slug, values] of slugOptions.entries()) {
      const common = [...restAttr.options].filter((opt) => values.has(opt)).length;
      if (common > bestScore) {
        bestScore = common;
        bestSlug = slug;
      }
    }

    if (bestScore > 0) {
      mapping[restAttr.name] = bestSlug;
    }
  }

  return mapping;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ProductDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // ─── UI State ────────────────────────────────────────────────────────────────
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [manualImageOverride, setManualImageOverride] = useState(false);

  /**
   * Unified attribute selections: { [attributeName]: selectedOption }
   * Covers both Color attrs and # Pill attrs.
   */
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // ─── Review State ─────────────────────────────────────────────────────────────
  const [reviews, setReviews] = useState<WooReview[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    reviewer: '',
    reviewer_email: '',
    review: '',
    rating: 5,
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // ─── GQL Variations (replaces broken REST variations_data) ───────────────────
  const [gqlVariations, setGqlVariations] = useState<NormalizedVariation[]>([]);
  const [isVariationsLoading, setIsVariationsLoading] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────────
  const { products: slugProducts = [], isLoading, error: fetchError } = useWooProducts({
    slug,
    autoFetch: !!slug,
  });

  const product = (slugProducts[0] as any) ?? null;

  // ─── Related Products ─────────────────────────────────────────────────────────
  const categoryId = product?.categories?.[0]?.id;
  const { products: relatedProducts = [] } = useWooProducts({
    category: categoryId,
    per_page: 4,
    autoFetch: !!categoryId,
  });

  /**
   * Check if a specific option for an attribute is available given current selections.
   */
  const isOptionAvailable = (attr: any, option: string) => {
    // For color attributes, always allow selection to enable exploration
    if (attr.name.toLowerCase().includes('color') || attr.name.toLowerCase().includes('colour')) {
      return true;
    }

    const tempSelected = { ...selectedAttributes };
    const attrKey = attr.slug ?? attr.name;
    tempSelected[attrKey] = option;
    if (attrKey !== attr.name) {
      tempSelected[attr.name] = option;
    }

    const variations = gqlVariations.length > 0 ? gqlVariations : (product?.variations_data ?? []);
    if (variations.length === 0) return true;

    const normaliseKey = (raw: string) =>
      raw.toLowerCase().replace(/^pa_/, '').replace(/^#\s*/, '').trim();
    const normaliseVal = (raw: string) => String(raw).toLowerCase().trim();

    const selectedNorm: Record<string, string> = {};
    for (const [k, v] of Object.entries(tempSelected)) {
      selectedNorm[normaliseKey(k)] = normaliseVal(v);
    }

    return variations.some((variation) => {
      const varNorm: Record<string, string> = {};
      for (const attr of variation.attributes) {
        varNorm[normaliseKey(attr.name)] = normaliseVal(attr.option);
      }

      return Object.entries(selectedNorm).every(([key, val]) => {
        const varVal = varNorm[key];
        if (!varVal || varVal === '') return true;
        return varVal === val;
      });
    });
  };

  // ─── Categorised Attributes (all useMemo — no early returns above) ────────────
  const restAttributeSlugMap = useMemo(() => {
    if (!product?.attributes) return {};
    return buildAttributeSlugMap(product.attributes, gqlVariations);
  }, [product?.attributes, gqlVariations]);

  const { colorAttrs, pillAttrs, specAttrs } = useMemo(() => {
    if (!product?.attributes) return { colorAttrs: [], pillAttrs: [], specAttrs: [] };
    return categoriseAttributes(product.attributes, restAttributeSlugMap);
  }, [product?.attributes, restAttributeSlugMap]);
  // ─── Product Variations logic ─────────────────────────────────────────────────

  const selectedVariation = useMemo(() => {
    // Use GQL variations when available; fall back to REST variations_data
    const variations: NormalizedVariation[] =
      gqlVariations.length > 0
        ? gqlVariations
        : (product?.variations_data ?? []);

    if (variations.length === 0) return null;

    /**
     * Normalise an attribute name so GQL slugs ("pa_color", "test-1") and
     * REST display names ("Color", "#Storage") collapse to the same key.
     * Steps: lowercase → strip "pa_" prefix → strip leading "#" → trim.
     */
    const normaliseKey = (raw: string) =>
      raw.toLowerCase().replace(/^pa_/, '').replace(/^#\s*/, '').trim();

    const normaliseVal = (raw: string) => String(raw).toLowerCase().trim();

    // Build a normalised map of what the user has currently selected
    const selectedNorm: Record<string, string> = {};
    for (const [k, v] of Object.entries(selectedAttributes)) {
      selectedNorm[normaliseKey(k)] = normaliseVal(v);
    }

    return variations.find((variation) => {
      // Build a normalised map for this variation's attributes
      const varNorm: Record<string, string> = {};
      for (const attr of variation.attributes) {
        // attr.option comes from GQL (value) or REST (option) — both mapped already
        varNorm[normaliseKey(attr.name)] = normaliseVal(attr.option);
      }

      // Every selected key must match; empty/missing variation value = "Any"
      return Object.entries(selectedNorm).every(([key, val]) => {
        const varVal = varNorm[key];
        if (!varVal || varVal === '') return true; // "Any [Attribute]"
        return varVal === val;
      });
    }) ?? null;
  }, [gqlVariations, product?.variations_data, selectedAttributes]);

  const detailProduct = useMemo(() => {
    if (!product) return null;

    // selectedVariation.image.src is already normalised by getProductBySlugGQL
    const activeImageUrl =
      selectedVariation?.image?.src || product.images?.[0]?.src || '';

    // selectedVariation.price is a plain numeric string ("4000")
    const activePrice = parseFloat(
      selectedVariation?.display_price || selectedVariation?.price || product.price || '0'
    );

    return {
      id: product.id.toString(),
      slug: product.slug,
      name: product.name,
      price: activePrice,
      image: activeImageUrl,
      category: product.categories?.[0]?.name || '',
      rating: parseFloat(product.average_rating),
      reviews: product.rating_count,
      description: product.description,
    };
  }, [product, selectedVariation]);

  // ─── Display Images (includes variation image if not in gallery) ─────────────
  const displayImages = useMemo(() => {
    const images: { src: string }[] = (product?.images || []).map((img: any) => ({ src: img.src }));
    if (selectedVariation?.image?.src) {
      if (!images.some((img) => img.src === selectedVariation.image.src)) {
        images.push({ src: selectedVariation.image.src });
      }
    }
    return images;
  }, [product?.images, selectedVariation?.image?.src]);

  const isFavorite = product ? isInWishlist(product.id.toString()) : false;

  // ─── Effects ──────────────────────────────────────────────────────────────────

  /**
   * Initialise selectedAttributes when the product (or its attrs) loads.
   * We build a map of { attrName → firstOption } for every Color + Pill attr.
   * We compare JSON to avoid infinite re-render loops caused by object identity.
   */
  useEffect(() => {
    if (!product) return;

    setActiveImageIndex(0);

    const allSelectable = [...colorAttrs, ...pillAttrs];
    if (allSelectable.length === 0) return;

    setSelectedAttributes((prev) => {
      const next: Record<string, string> = {};

      for (const attr of allSelectable) {
        const name: string = attr.name;
        const attrKey: string = attr.slug ?? name;
        const options: string[] = attr.options ?? [];
        if (options.length === 0) continue;

        // Prefer WooCommerce default_attributes if provided, else keep existing
        // selection, else fall back to first available option.
        const wooDefault = product.default_attributes?.find(
          (d: any) => d.name === name || d.id === attr.id
        )?.option;

        const availableOptions = options.filter(opt => isOptionAvailable(attr, opt));
        const defaultOption = wooDefault && availableOptions.includes(wooDefault) ? wooDefault : availableOptions[0] ?? options[0];

        next[attrKey] = defaultOption;
        if (attrKey !== name) {
          next[name] = next[attrKey];
        }
      }

      // Bail out early if nothing actually changed (prevents extra renders)
      if (JSON.stringify(prev) === JSON.stringify(next)) return prev;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, colorAttrs, pillAttrs]);

  // Fetch GQL variations whenever the product slug changes.
  // Only runs for variable products (type === 'variable'); safe no-op otherwise.
  useEffect(() => {
    if (!slug || !product) return;
    let cancelled = false;
    const fetchVariations = async () => {
      setIsVariationsLoading(true);
      try {
        const vars = await getProductBySlugGQL(slug);
        if (!cancelled) setGqlVariations(vars);
      } catch (err) {
        console.error('GQL variations fetch failed:', err);
      } finally {
        if (!cancelled) setIsVariationsLoading(false);
      }
    };
    fetchVariations();
    return () => { cancelled = true; };
  }, [slug, product]);

  useEffect(() => {
    if (!product || Object.keys(restAttributeSlugMap).length === 0) return;

    setSelectedAttributes((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      for (const [name, slug] of Object.entries(restAttributeSlugMap)) {
        if (!slug || slug === name) continue;
        if (prev[name] !== undefined && next[slug] !== prev[name]) {
          next[slug] = prev[name];
          hasChanges = true;
        }
        if (prev[slug] !== undefined && next[name] !== prev[slug]) {
          next[name] = prev[slug];
          hasChanges = true;
        }
      }

      return hasChanges ? next : prev;
    });
  }, [product, restAttributeSlugMap]);

  // Ensure selected options are still available when variations or selections change
  useEffect(() => {
    if (!product) return;

    setSelectedAttributes((prev) => {
      const next = { ...prev };
      let hasChanges = false;

      const allSelectable = [...colorAttrs, ...pillAttrs];
      for (const attr of allSelectable) {
        const attrKey = attr.slug ?? attr.name;
        const selected = prev[attrKey] ?? prev[attr.name] ?? '';
        if (selected && !isOptionAvailable(attr, selected)) {
          // Find first available option
          const availableOptions = (attr.options as string[]).filter(option => isOptionAvailable(attr, option));
          if (availableOptions.length > 0) {
            next[attrKey] = availableOptions[0];
            if (attrKey !== attr.name) {
              next[attr.name] = availableOptions[0];
            }
            hasChanges = true;
          }
        }
      }

      return hasChanges ? next : prev;
    });
  }, [gqlVariations, product?.variations_data, colorAttrs, pillAttrs]);

  // Fetch reviews when tab is opened
  useEffect(() => {
    if (activeTab !== 'reviews' || !product) return;
    const fetchReviews = async () => {
      setIsReviewsLoading(true);
      const response = await getProductReviews(product.id);
      if (response.success && response.data) setReviews(response.data);
      setIsReviewsLoading(false);
    };
    fetchReviews();
  }, [activeTab, product]);

  // Swap the active image when the selected variation changes
  useEffect(() => {
    if (!selectedVariation?.image?.src || isVariationsLoading) return;
    const varSrc = selectedVariation.image.src;
    const index = displayImages.findIndex((img) => img.src === varSrc);
    // If the variation image is in the display images, focus it; otherwise show it at index 0
    if (index !== undefined && index !== -1 && index !== activeImageIndex) {
      setActiveImageIndex(index);
    }
    setManualImageOverride(false);
  }, [selectedVariation, displayImages, isVariationsLoading]);

  // 2. The Auto-Rotate (with safety check)
  useEffect(() => {
    if (!displayImages || displayImages.length <= 1 || manualImageOverride) return;

    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % displayImages.length);
    }, 5000); // Increased to 5s to allow user to see their selection

    return () => clearInterval(interval);
  }, [displayImages, manualImageOverride]);

  // ─── EARLY RETURNS — after all hooks ─────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="mt-4 text-on-surface/50">Loading product...</p>
      </div>
    );
  }

  if (!product || fetchError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="text-on-surface/50 mb-6">The product you're looking for doesn't exist.</p>
        <Link to="/shop" className="bg-black text-white px-8 py-3 rounded-xl font-bold">
          Back to Shop
        </Link>
      </div>
    );
  }

  // ─── Stock / Cart Logic ───────────────────────────────────────────────────────
  const isInStock = product.stock_status !== 'outofstock';
  const isAlreadyInCart = cart.some((item) => item.id === product.id.toString());
  const hasVariations = gqlVariations.length > 0 || (product?.variations_data && product.variations_data.length > 0);
  const canAddToCart = isInStock && !(product.sold_individually && isAlreadyInCart) && (!hasVariations || !!selectedVariation);

  // Convenience shorthand for the selected color name
  const selectedColorName =
    colorAttrs[0]
      ? selectedAttributes[colorAttrs[0].slug ?? colorAttrs[0].name] ?? selectedAttributes[colorAttrs[0].name] ?? ''
      : '';

  const activeImageUrl = displayImages[activeImageIndex]?.src || '';

  // ─── Event Handlers ───────────────────────────────────────────────────────────
  const formatAttributeKey = (key: string) =>
    key
      .replace(/^pa_/, '')
      .replace(/^#\s*/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim();

  const buildCartSelection = () => {
    const allSelections: Record<string, string> = {};
    Object.entries(selectedAttributes).forEach(([key, value]) => {
      const cleanKey = formatAttributeKey(key);
      const stringValue = typeof value === 'object' ? Object.values(value)[0] : value;
      allSelections[cleanKey] = String(stringValue);
    });

    const selectedColor = allSelections['Color'] || allSelections['Colour'] || '';
    const selectedModel = allSelections['Model'] || allSelections['model'] || Object.values(allSelections).find((val) => val !== selectedColor) || '';

    return { allSelections, selectedColor, selectedModel };
  };

  const handleSelectAttribute = (attr: any, option: string) => {
    const attrKey = attr.slug ?? attr.name;
    setSelectedAttributes((prev) => ({
      ...prev,
      [attrKey]: option,
      ...(attrKey !== attr.name ? { [attr.name]: option } : {}),
    }));
  };

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      alert('Please select a valid combination of options.');
      return;
    }
    if (detailProduct) {
      const { allSelections, selectedColor, selectedModel } = buildCartSelection();
      addToCart({
        ...detailProduct,
        allAttributes: allSelections,
        selectedColor,
        selectedModel,
      }, quantity, selectedColor, selectedModel);
    }
  };

  const handleBuyNow = () => {
    if (hasVariations && !selectedVariation) {
      alert('Please select a valid combination of options.');
      return;
    }
    if (detailProduct) {
      const { allSelections, selectedColor, selectedModel } = buildCartSelection();
      addToCart({
        ...detailProduct,
        allAttributes: allSelections,
        selectedColor,
        selectedModel,
      }, quantity, selectedColor, selectedModel);
      navigate('/checkout');
    }
  };

  const handleWishlistClick = () => {
    if (!isAuthenticated) { navigate('/account'); return; }
    if (detailProduct) toggleWishlist(detailProduct);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    const response = await createProductReview({ product_id: product.id, ...reviewFormData });
    if (response.success && response.data) {
      setReviews((prev) => [response.data!, ...prev]);
      setReviewFormData({ reviewer: '', reviewer_email: '', review: '', rating: 5 });
    } else {
      alert(response.error?.message || 'Failed to submit review');
    }
    setIsSubmittingReview(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-8 lg:px-12 py-20">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/30 mb-16 overflow-x-auto whitespace-nowrap pb-4">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight size={10} />
        <Link to="/shop" className="hover:text-primary transition-colors">Shop</Link>
        <ChevronRight size={10} />
        <span className="text-on-surface/60">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">

        {/* Product Images */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-4/5 bg-surface-container-low rounded-2xl overflow-hidden shadow-ambient"
          >
            <img
              src={activeImageUrl || 'https://picsum.photos/seed/product/400/500'}
              alt={product?.name || 'Product Image'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div className="grid grid-cols-4 gap-6">
            {displayImages.slice(0, 4).map((img, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setActiveImageIndex(i);
                  setManualImageOverride(true);
                }}
                className={cn(
                  'aspect-square rounded-2xl overflow-hidden transition-all duration-500 border-2',
                  activeImageIndex === i
                    ? 'border-primary shadow-ambient opacity-100'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <img
                  src={img.src}
                  alt={`${product.name} view ${i + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.floor(parseFloat(product.average_rating)) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="text-xs font-label font-bold text-on-surface/30 tracking-widest">
                {product.average_rating} ({product.rating_count} REVIEWS)
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold tracking-tight mb-6 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-4 mb-8">
              {/* MAIN PRICE */}
              <span className="text-4xl font-display font-extrabold text-primary">
                Rs.{' '}
                {(() => {
                  // Priority order: variation price → product price
                  let currentPrice: string | number = "0";

                  if (selectedVariation) {
                    currentPrice = selectedVariation.display_price || selectedVariation.price || product?.price;
                  } else {
                    currentPrice = product?.price;
                  }

                  return parseFloat(String(currentPrice)).toLocaleString('ur-PK', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                  });
                })()}
              </span>

              {/* REGULAR PRICE (Crossed out) */}
              {(() => {
                let regPrice: string | number | undefined;
                let activePrice: string | number | undefined;

                if (selectedVariation) {
                  // GQL has no regularPrice — display_regular_price will be ''
                  // so we skip the struck-through price for GQL-sourced variations
                  // unless the REST fallback has it.
                  regPrice = selectedVariation.display_regular_price || selectedVariation.regular_price;
                  activePrice = selectedVariation.display_price || selectedVariation.price;
                } else {
                  regPrice = product?.regular_price;
                  activePrice = product?.price;
                }

                // Only show if regular price exists and is higher than current price
                if (regPrice && activePrice) {
                  const regular = parseFloat(String(regPrice));
                  const current = parseFloat(String(activePrice));

                  if (regular > current) {
                    return (
                      <span className="text-xl text-on-surface/40 line-through decoration-primary/30">
                        Rs. {regular.toLocaleString('ur-PK', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    );
                  }
                }
                return null;
              })()}
            </div>
            <p className="text-lg text-on-surface/50 leading-relaxed max-w-xl font-medium">
              {product.short_description?.replace(/<[^>]*>/g, '') ||
                product.description?.replace(/<[^>]*>/g, '')}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-12 mb-16">

            {/* ── Color Swatches ─────────────────────────────────────────────── */}
            {colorAttrs.map((attr: any) => {
              const attrKey: string = attr.slug ?? attr.name;
              const selected = selectedAttributes[attrKey] ?? selectedAttributes[attr.name] ?? '';
              return (
                <div key={attrKey}>
                  <h3 className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/40 mb-6">
                    {/* Strip the word "Color/Colour" for cleaner display */}
                    Color:{' '}
                    <span className="text-on-surface">{selected}</span>
                  </h3>
                  <div className="flex gap-4 flex-wrap">
                    {(attr.options as string[]).map((color) => {
                      const available = isOptionAvailable(attr, color);
                      const isSelected = selected === color;
                      return (
                        <button
                          key={color}
                          onClick={() => handleSelectAttribute(attr, color)}
                          className={cn(
                            'w-12 h-12 rounded-full transition-all duration-500 flex items-center justify-center shadow-sm',
                            isSelected ? 'ring-2 ring-primary ring-offset-4 scale-110' : 'hover:scale-105',
                            !available && 'ring-2 ring-red-500 opacity-70 cursor-not-allowed'
                          )}
                          title={color}
                        >
                          <div
                            className={cn('w-10 h-10 rounded-full shadow-inner', getColorStyle(color).className)}
                            style={getColorStyle(color).inlineStyle}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* ── Pill Selectors (# attributes) ─────────────────────────────── */}
            {pillAttrs.map((attr: any) => {
              const attrKey: string = attr.slug ?? attr.name;
              // Use attr.id or slug as the key—this avoids collisions when display
              // names are similar but the underlying attribute is different.
              const uniqueKey = attr.id || attrKey;

              const displayName = attr.name.replace(/^#\s*/, '');
              const selected = selectedAttributes[attrKey] ?? selectedAttributes[attr.name] ?? '';

              return (
                <div key={uniqueKey} className="mb-10 last:mb-0">
                  <h3 className="text-[10px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/40 mb-6">
                    {displayName}:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(attr.options as string[]).map((option) => {
                      const available = isOptionAvailable(attr, option);
                      const isSelected = selected === option;
                      return (
                        <button
                          key={option}
                          onClick={() => handleSelectAttribute(attr, option)}
                          className={cn(
                            'px-6 py-4 rounded-xl text-sm font-bold transition-all duration-500 flex items-center justify-between',
                            isSelected
                              ? 'bg-primary text-white shadow-ambient'
                              : available
                                ? 'bg-surface-container-low text-on-surface/60 hover:bg-white hover:shadow-sm'
                                : 'bg-red-50 text-red-600 cursor-not-allowed'
                          )}
                        >
                          {option}
                          {isSelected && <Check size={18} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Quantity and Actions */}
            <div className="flex flex-col gap-6 pt-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex items-center bg-surface-container-low rounded-xl p-1.5 w-fit">
                  <button
                    disabled={product.sold_individually || quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-14 h-14 flex items-center justify-center hover:bg-white rounded-lg transition-all duration-300 text-on-surface/60 disabled:opacity-30"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-14 text-center font-display font-extrabold text-xl">{quantity}</span>
                  <button
                    disabled={product.sold_individually || !canAddToCart}
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-14 h-14 flex items-center justify-center hover:bg-white rounded-lg transition-all duration-300 text-on-surface/60 disabled:opacity-30"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex-1 flex gap-4">
                  <button
                    disabled={!canAddToCart}
                    onClick={handleAddToCart}
                    className="btn-secondary flex-1 py-5 text-lg flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <ShoppingCart size={24} />
                    {!isInStock
                      ? 'Out of Stock'
                      : isAlreadyInCart && product.sold_individually
                        ? 'In Cart'
                        : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleWishlistClick}
                    className={cn(
                      'w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm',
                      isFavorite
                        ? 'bg-primary text-white shadow-ambient'
                        : 'bg-surface-container-low text-on-surface/40 hover:bg-white hover:text-primary hover:shadow-ambient'
                    )}
                  >
                    <Heart size={24} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
              <button
                disabled={!canAddToCart}
                onClick={handleBuyNow}
                className="btn-primary w-full py-6 text-xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {!isInStock
                  ? 'Out of Stock'
                  : isAlreadyInCart && product.sold_individually
                    ? 'In Cart'
                    : 'Buy Now'}
                <ArrowRight size={24} />
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-4 gap-8 py-10 border-t border-outline-variant/10">
            {[
              { icon: <Truck size={20} />, label: 'Free Shipping' },
              { icon: <RefreshCw size={20} />, label: 'Easy Returns' },
              { icon: <Shield size={20} />, label: 'Secure Warranty' },
              { icon: <MapPin size={20} />, label: 'Local Delivery' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center gap-3 group">
                <div className="w-12 h-12 bg-surface-container-low text-primary/30 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
                  {icon}
                </div>
                <span className="text-[9px] font-label font-bold uppercase tracking-[0.2em] text-on-surface/40">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <section className="mb-32">
        <div className="flex gap-12 border-b border-outline-variant/10 mb-12 overflow-x-auto pb-4">
          {(['description', 'specs', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'text-sm font-label font-bold uppercase tracking-[0.2em] transition-all relative pb-4',
                activeTab === tab ? 'text-primary' : 'text-on-surface/30 hover:text-on-surface/60'
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-75">
          {/* Description Tab */}
          {activeTab === 'description' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl text-on-surface/50 leading-relaxed font-medium text-lg space-y-8"
            >
              {product.short_description && (
                <div
                  dangerouslySetInnerHTML={{ __html: product.short_description }}
                  className="prose prose-invert max-w-none"
                />
              )}
              {product.description && (
                <div
                  dangerouslySetInnerHTML={{ __html: product.description }}
                  className="prose prose-invert max-w-none"
                />
              )}
              {!product.description && !product.short_description && (
                <p>No description available for this product.</p>
              )}
            </motion.div>
          )}

          {/* Specs Tab — only non-Color, non-Pill attributes */}
          {activeTab === 'specs' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-4xl"
            >
              {specAttrs.length > 0 ? (
                <div className="space-y-6 col-span-full">
                  {specAttrs.map((attr: any, i: number) => (
                    <div key={attr.id || i} className="flex justify-between items-start py-4 border-b border-outline-variant/10">
                      <span className="text-on-surface/40 font-label font-bold uppercase tracking-widest text-[10px]">
                        {attr.name.replace(/^#\s*/, '')}
                      </span>
                      <span className="font-display font-bold text-right">
                        {Array.isArray(attr.options) ? attr.options.join(', ') : attr.options}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback: show basic product meta when no spec attributes exist */
                <div className="col-span-full">
                  <div className="flex justify-between py-4 border-b border-outline-variant/10">
                    <span className="text-on-surface/40 font-label font-bold uppercase tracking-widest text-[10px]">SKU</span>
                    <span className="font-display font-bold">{product.sku || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-outline-variant/10">
                    <span className="text-on-surface/40 font-label font-bold uppercase tracking-widest text-[10px]">Stock Status</span>
                    <span className="font-display font-bold text-primary">{isInStock ? 'In Stock' : 'Out of Stock'}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b border-outline-variant/10">
                    <span className="text-on-surface/40 font-label font-bold uppercase tracking-widest text-[10px]">Shipping Class</span>
                    <span className="font-display font-bold">{product.shipping_class || 'Standard'}</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10 max-w-4xl"
            >
              <div className="bg-surface-container-low p-10 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-8">
                <div className="mb-6">
                  <div className="flex text-primary mb-3">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        size={14}
                        fill={j < Math.floor(parseFloat(product.average_rating)) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <h4 className="font-display font-extrabold text-xl tracking-tight">Overall Rating</h4>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-5xl font-display font-extrabold text-primary">{product.average_rating}</span>
                  <div>
                    <p className="font-bold">
                      {product.rating_count} {product.rating_count === 1 ? 'Review' : 'Reviews'}
                    </p>
                    <p className="text-sm text-on-surface/50">Based on customer feedback</p>
                  </div>
                </div>
                <div className="h-px md:h-20 md:w-px bg-outline-variant/20 self-center" />
                <div className="flex-1">
                  <h4 className="font-bold mb-4">Leave a Review</h4>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        required
                        type="text"
                        placeholder="Name"
                        className="bg-white px-4 py-2 rounded-lg outline-none text-sm"
                        value={reviewFormData.reviewer}
                        onChange={(e) =>
                          setReviewFormData((prev) => ({ ...prev, reviewer: e.target.value }))
                        }
                      />
                      <input
                        required
                        type="email"
                        placeholder="Email"
                        className="bg-white px-4 py-2 rounded-lg outline-none text-sm"
                        value={reviewFormData.reviewer_email}
                        onChange={(e) =>
                          setReviewFormData((prev) => ({ ...prev, reviewer_email: e.target.value }))
                        }
                      />
                    </div>
                    <select
                      className="w-full bg-white px-4 py-2 rounded-lg outline-none text-sm"
                      value={reviewFormData.rating}
                      onChange={(e) =>
                        setReviewFormData((prev) => ({ ...prev, rating: parseInt(e.target.value) }))
                      }
                    >
                      <option value="5">5 Stars</option>
                      <option value="4">4 Stars</option>
                      <option value="3">3 Stars</option>
                      <option value="2">2 Stars</option>
                      <option value="1">1 Star</option>
                    </select>
                    <textarea
                      required
                      placeholder="Your review"
                      className="w-full bg-white px-4 py-2 rounded-lg outline-none text-sm h-24 resize-none"
                      value={reviewFormData.review}
                      onChange={(e) =>
                        setReviewFormData((prev) => ({ ...prev, review: e.target.value }))
                      }
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingReview}
                      className="btn-primary w-full py-2 text-xs disabled:opacity-50"
                    >
                      {isSubmittingReview ? 'Posting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-8 mt-12">
                {isReviewsLoading ? (
                  <p className="text-center py-8 text-on-surface/50">Loading reviews...</p>
                ) : reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-outline-variant/10 pb-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-lg">{rev.reviewer}</p>
                          <div className="flex text-primary gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} fill={i < rev.rating ? 'currentColor' : 'none'} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-on-surface/30 font-label font-bold uppercase">
                          {new Date(rev.date_created).toLocaleDateString()}
                        </span>
                      </div>
                      <div
                        className="text-on-surface/60 leading-relaxed prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: rev.review }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-on-surface/50 text-center py-8">
                    No reviews yet. Be the first to review this product!
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Related Products */}
      <section>
        <div className="flex justify-between items-end mb-16">
          <div>
            <span className="text-primary font-label font-bold uppercase tracking-widest text-[10px] mb-3 block">
              You May Also Like
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight">Related Products</h2>
          </div>
          <Link
            to="/shop"
            className="text-sm font-bold flex items-center gap-2 text-primary hover:gap-4 transition-all"
          >
            View All <ArrowRight size={18} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {relatedProducts
            .filter((p) => p.id !== product.id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>

    </div>
  );
};

export default ProductDetail;
