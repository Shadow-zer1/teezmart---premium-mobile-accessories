import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem, Product } from '../types';
import { useAuth } from './AuthContext';
import { getStoreSettings, getShippingMethods, getTaxRates } from '../services/wordpress';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedColor?: string, selectedModel?: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  settings: {
    shippingThreshold: number;
    flatRateCost: number;
    taxRate: number;
    isTaxEnabled: boolean;
    isCouponsEnabled: boolean;
    isLoading: boolean;
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [settings, setSettings] = useState<CartContextType['settings']>({
    shippingThreshold: 5000,
    flatRateCost: 250,
    taxRate: 0,
    isTaxEnabled: false,
    isCouponsEnabled: false,
    isLoading: true,
  });

  const getKey = (uid?: number | null) =>
    uid ? `teezmart_cart_${uid}` : 'teezmart_cart_guest';

  const getCartItemId = (item: any) =>
    `${item.id}-${item.selectedColor || ''}-${item.selectedModel || ''}-${JSON.stringify(item.allAttributes || {})}`;

  // Load cart when auth state / user changes
  useEffect(() => {
    const userKey = getKey(user?.id);
    const guestKey = getKey(null);
    let items: CartItem[] = [];

    try {
      const saved = localStorage.getItem(userKey);
      if (saved) items = JSON.parse(saved).map((item: CartItem) => ({
        ...item,
        cartItemId: item.cartItemId || getCartItemId(item),
      }));
    } catch { /* ignore */ }

    // On login: merge guest cart into user cart
    if (isAuthenticated && user?.id) {
      try {
        const guestRaw = localStorage.getItem(guestKey);
        if (guestRaw) {
          const guestItems: CartItem[] = JSON.parse(guestRaw).map((item: CartItem) => ({
            ...item,
            cartItemId: item.cartItemId || getCartItemId(item),
          }));
          guestItems.forEach(g => {
            const exists = items.find((i) => i.cartItemId === g.cartItemId);
            if (exists) exists.quantity += g.quantity;
            else items.push(g);
          });
          localStorage.removeItem(guestKey);
        }
      } catch { /* ignore */ }
    }

    setCart(items);
  }, [isAuthenticated, user?.id]);

  // Persist whenever cart changes
  useEffect(() => {
    const key = getKey(isAuthenticated ? user?.id : null);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, isAuthenticated, user?.id]);

  // Load dynamic settings once
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, shippingRes, taxRes] = await Promise.all([
          getStoreSettings(),
          getShippingMethods(1),
          getTaxRates()
        ]);

        const isTaxEnabled = settingsRes.success && settingsRes.data?.find((s: any) => s.id === 'woocommerce_calc_taxes')?.value === 'yes';
        const isCouponsEnabled = settingsRes.success && settingsRes.data?.find((s: any) => s.id === 'woocommerce_enable_coupons')?.value === 'yes';
        
        let threshold = 5000;
        let cost = 250;
        if (shippingRes.success && shippingRes.data) {
          const freeShipping = shippingRes.data.find((m: any) => m.method_id === 'free_shipping');
          threshold = parseFloat(freeShipping?.settings?.min_amount?.value || '5000');
          const flatRate = shippingRes.data.find((m: any) => m.method_id === 'flat_rate');
          cost = parseFloat(flatRate?.settings?.cost?.value || '250');
        }

        let rate = 0;
        if (taxRes.success && taxRes.data && taxRes.data.length > 0) {
          rate = parseFloat(taxRes.data[0].rate) / 100;
        }

        setSettings({ shippingThreshold: threshold, flatRateCost: cost, taxRate: rate, isTaxEnabled, isCouponsEnabled, isLoading: false });
      } catch (err) {
        setSettings(prev => ({ ...prev, isLoading: false }));
      }
    };
    fetchSettings();
  }, []);

  const addToCart = (product: Product, quantity = 1, selectedColor?: string, selectedModel?: string) => {
    setCart(prev => {
      const item = {
        ...product,
        quantity,
        selectedColor,
        selectedModel,
        allAttributes: (product as any).allAttributes,
      } as CartItem;
      item.cartItemId = getCartItemId(item);

      const existing = prev.find((i) => i.cartItemId === item.cartItemId);
      if (existing) return prev.map((i) => i.cartItemId === item.cartItemId ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, item];
    });
  };

  const removeFromCart = (cartItemId: string) =>
    setCart(prev => prev.filter(i => i.cartItemId !== cartItemId));

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(cartItemId); return; }
    setCart(prev => prev.map(i => i.cartItemId === cartItemId ? { ...i, quantity } : i));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((t, i) => t + i.price * i.quantity, 0);
  const cartCount = cart.reduce((c, i) => c + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, settings }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
