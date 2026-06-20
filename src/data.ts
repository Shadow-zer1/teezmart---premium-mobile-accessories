import type { Product, Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "iphone", name: "iPhone Cases", icon: "Smartphone", image: "https://picsum.photos/seed/iphone/400/400" },
  { id: "samsung", name: "Samsung Cases", icon: "Smartphone", image: "https://picsum.photos/seed/samsung/400/400" },
  { id: "pixel", name: "Pixel Cases", icon: "Smartphone", image: "https://picsum.photos/seed/pixel/400/400" },
  { id: "chargers", name: "Chargers", icon: "Zap", image: "https://picsum.photos/seed/charger/400/400" },
  { id: "screen", name: "Screen Protectors", icon: "Shield", image: "https://picsum.photos/seed/screen/400/400" },
  { id: "magsafe", name: "MagSafe", icon: "Magnet", image: "https://picsum.photos/seed/magsafe/400/400" },
];

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "MagSafe Armor Series Case",
    price: 24.99,
    originalPrice: 39.99,
    image: "https://picsum.photos/seed/case1/600/800",
    category: "iphone",
    description: "Ultra-durable MagSafe compatible case with reinforced corners and sleek finish.",
    rating: 4.8,
    reviews: 124,
    isFlashSale: true,
    discount: 38
  },
  {
    id: "2",
    name: "Crystal Clear Slim Case",
    price: 19.99,
    image: "https://picsum.photos/seed/case2/600/800",
    category: "iphone",
    description: "Show off your phone's original design with our crystal clear, anti-yellowing slim case.",
    rating: 4.5,
    reviews: 89
  },
  {
    id: "3",
    name: "Leather Wallet Case",
    price: 34.99,
    originalPrice: 49.99,
    image: "https://picsum.photos/seed/case3/600/800",
    category: "iphone",
    description: "Premium genuine leather wallet case with card slots and kickstand functionality.",
    rating: 4.7,
    reviews: 56,
    isFlashSale: true,
    discount: 30
  },
  {
    id: "4",
    name: "20W USB-C Fast Charger",
    price: 15.99,
    image: "https://picsum.photos/seed/charger1/600/800",
    category: "chargers",
    description: "Compact and powerful 20W USB-C fast charger for all your mobile devices.",
    rating: 4.9,
    reviews: 210
  },
  {
    id: "5",
    name: "9H Tempered Glass Protector",
    price: 9.99,
    image: "https://picsum.photos/seed/screen1/600/800",
    category: "screen",
    description: "Ultra-thin 9H hardness tempered glass screen protector with oleophobic coating.",
    rating: 4.6,
    reviews: 156
  },
  {
    id: "6",
    name: "MagSafe Magnetic Ring",
    price: 12.99,
    image: "https://picsum.photos/seed/magsafe1/600/800",
    category: "magsafe",
    description: "Add MagSafe compatibility to any case with our high-strength magnetic ring.",
    rating: 4.4,
    reviews: 42
  }
];
