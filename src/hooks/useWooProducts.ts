import { useState, useEffect, useCallback } from 'react';
import { getProducts, getProduct, getProductCategories } from '../services/wordpress';
import type { WooProduct } from '../services/wordpress';

interface UseWooProductsOptions {
  slug?: string;
  page?: number;
  per_page?: number;
  search?: string;
  category?: number;
  on_sale?: boolean;
  featured?: boolean;
  orderby?: "date" | "id" | "include" | "title" | "slug" | "price" | "popularity" | "rating";
  order?: 'asc' | 'desc';
  autoFetch?: boolean;

}

export function useWooProducts(options: UseWooProductsOptions = {}) {
  const [products, setProducts] = useState<WooProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await getProducts({
      page: options.page || 1,
      per_page: options.per_page || 20,
      search: options.search,
      slug: options.slug,
      category: options.category,
      on_sale: options.on_sale,
      orderby: options.orderby,
      order: options.order,
    });

    if (response.success && response.data) {
      setProducts(response.data);
    } else {
      setError(response.error?.message || 'Failed to fetch products');
    }
    setIsLoading(false);
  }, [
    options.page,
    options.per_page,
    options.search,
    options.category,
    options.slug,
    options.on_sale,
    options.orderby,
    options.order,
  ]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchProducts();
    }
  }, [fetchProducts, options.autoFetch]);

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
  };
}

export function useWooProduct(productId: number | string | undefined) {
  const [product, setProduct] = useState<WooProduct | null>(null);
  const [isLoading, setIsLoading] = useState(!!productId);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    setIsLoading(true);
    setError(null);

    const response = await getProduct(productId);

    if (response.success && response.data) {
      setProduct(response.data);
    } else {
      setError(response.error?.message || 'Failed to fetch product');
    }
    setIsLoading(false);
  }, [productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    product,
    isLoading,
    error,
    refetch: fetchProduct,
  };
}

export function useWooCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await getProductCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch categories');
      }
      setIsLoading(false);
    };

    fetchCategories();
  }, []);

  return {
    categories,
    isLoading,
    error,
  };
}
