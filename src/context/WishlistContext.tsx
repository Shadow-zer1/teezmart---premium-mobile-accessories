import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Product } from '../types';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const initialized = useRef(false);

  const getKey = (uid?: number | null) =>
    uid ? `teezmart_wishlist_${uid}` : 'teezmart_wishlist_guest';

  // Load wishlist when auth state / user changes
  useEffect(() => {
    initialized.current = false;
    const userKey = getKey(user?.id);
    const guestKey = getKey(null);
    let items: Product[] = [];

    try {
      const saved = localStorage.getItem(userKey);
      if (saved) items = JSON.parse(saved);
    } catch { /* ignore */ }

    // On login: merge guest wishlist
    if (isAuthenticated && user?.id) {
      try {
        const guestRaw = localStorage.getItem(guestKey);
        if (guestRaw) {
          const guestItems: Product[] = JSON.parse(guestRaw);
          guestItems.forEach(g => {
            if (!items.find(i => i.id === g.id)) items.push(g);
          });
          localStorage.removeItem(guestKey);
        }
      } catch { /* ignore */ }
    }

    setWishlist(items);
    setTimeout(() => { initialized.current = true; }, 0);
  }, [isAuthenticated, user?.id]);

  // Persist whenever wishlist changes (but not on first load)
  useEffect(() => {
    if (!initialized.current) return;
    const key = getKey(isAuthenticated ? user?.id : null);
    localStorage.setItem(key, JSON.stringify(wishlist));
  }, [wishlist]);

  const addToWishlist = (product: Product) =>
    setWishlist(prev => prev.find(i => i.id === product.id) ? prev : [...prev, product]);

  const removeFromWishlist = (productId: string) =>
    setWishlist(prev => prev.filter(i => i.id !== productId));

  const isInWishlist = (productId: string) => wishlist.some(i => i.id === productId);

  const toggleWishlist = (product: Product) =>
    isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product);

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, toggleWishlist, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
