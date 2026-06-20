export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  isFlashSale?: boolean;
  discount?: number;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedModel?: string;
  allAttributes?: Record<string, string>;
  cartItemId?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image: string;
}
