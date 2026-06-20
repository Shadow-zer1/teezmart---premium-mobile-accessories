# WordPress Integration Guide

## 🔧 Setup Instructions

### 1. WordPress Configuration

#### Install JWT Authentication Plugin
1. Go to your WordPress Admin Dashboard
2. Navigate to **Plugins → Add New**
3. Search for "JWT Authentication for REST API" by Useful Team
4. Click **Install** and **Activate**

#### Install Password Reset Plugin
1. Navigate to **Plugins → Add New**
2. Search for **"WP REST API-V2 Forgot Password"**
3. Install and **Activate**

#### Configure REST API & CORS
1. Install and activate **REST API Enabler** or **Easy Custom Post Types** (if not already enabled)
2. Go to **Settings → Permalinks**
3. Choose any permalink structure (NOT plain) - **Save Changes**
4. Install **CORS Headers** plugin:
   - Plugins → Add New
   - Search "CORS Headers"
   - Activate it

#### Configure JWT Secret
1. Go to **JWT Settings** in WordPress admin
2. Copy your JWT Secret Key

### 2. Update Environment Variables

Edit [.env.local](.env.local):
```env
VITE_WORDPRESS_URL=https://wordpress-production-27ad.up.railway.app
VITE_WC_CONSUMER_KEY=your_woocommerce_consumer_key
VITE_WC_CONSUMER_SECRET=your_woocommerce_consumer_secret
VITE_BREVO_API_KEY=your_brevo_api_key
VITE_BREVO_LIST_ID=2
```

### 3. API Services

Two main services have been created:

#### **WordPress Service** (`src/services/wordpress.ts`)
- JWT authentication (login, register, logout)
- WooCommerce products (fetch, filter, search)
- Orders management
- Cart operations

#### **React Hooks** (`src/hooks/`)
- `useWpAuth` - Handle user authentication
- `useWooProducts` - Fetch and manage products
- `useWooCategories` - Fetch product categories

## 📖 Usage Examples

### Login/Register User

```typescript
import { useWpAuth } from '@/hooks/useWpAuth';

function LoginComponent() {
  const { login, register, isLoading, error, isAuthenticated } = useWpAuth();

  const handleLogin = async () => {
    const result = await login({
      username: 'john_doe',
      password: 'password123',
    });
    if (result.success) {
      console.log('Logged in!');
    }
  };

  return (
    <div>
      {isAuthenticated && <p>Welcome back!</p>}
      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
```

### Fetch Products

```typescript
import { useWooProducts } from '@/hooks/useWooProducts';

function ProductsShop() {
  const { products, isLoading, error } = useWooProducts({
    page: 1,
    per_page: 20,
    orderby: 'popularity',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
          {product.on_sale && <span>SALE</span>}
        </div>
      ))}
    </div>
  );
}
```

### Fetch Single Product

```typescript
import { useWooProduct } from '@/hooks/useWooProducts';

function ProductDetail({ productId }) {
  const { product, isLoading, error } = useWooProduct(productId);

  if (isLoading) return <div>Loading...</div>;
  if (error || !product) return <div>Product not found</div>;

  return (
    <div>
      <h1>{product.name}</h1>
      <img src={product.images[0]?.src} alt={product.name} />
      <p>{product.description}</p>
      <p className="text-2xl font-bold">${product.price}</p>
      <p>⭐ {product.average_rating} ({product.rating_count} reviews)</p>
    </div>
  );
}
```

### Fetch Product Categories

```typescript
import { useWooCategories } from '@/hooks/useWooProducts';

function CategoriesPage() {
  const { categories, isLoading } = useWooCategories();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {categories.map(cat => (
        <div key={cat.id} className="p-4 border rounded">
          {cat.image && <img src={cat.image.src} alt={cat.name} />}
          <h3>{cat.name}</h3>
        </div>
      ))}
    </div>
  );
}
```

## 🔐 Authentication Flow

1. User enters credentials in login form
2. `login()` sends POST request to `/jwt-auth/v1/token`
3. Server returns JWT token
4. Token is stored in localStorage
5. All subsequent requests include token in `Authorization: Bearer <token>` header
6. Extract user data from `/wp/v2/users/me`

## 📦 WooCommerce REST API Endpoints

The service includes these endpoints:

- `GET /wc/v3/products` - List products
- `GET /wc/v3/products/{id}` - Get single product
- `GET /wc/v3/products/categories` - Get categories
- `GET /wc/v3/orders` - Get user orders (requires auth)
- `POST /wc/v3/orders` - Create order (requires auth)
- `GET /wc/v3/orders/{id}` - Get order details (requires auth)
- `POST /wc/store/v1/cart/add-item` - Add to cart
- `GET /wc/store/v1/cart` - Get cart
- `POST /wc/store/v1/cart/remove-item` - Remove from cart

## ⚠️ Common Issues

### "Invalid token" Error
- Check JWT Secret in .env.local matches WordPress settings
- Verify JWT plugin is activated
- Token may have expired (7 day expiry)

### CORS Errors
- Install CORS Headers plugin on WordPress
- Enable it in WordPress settings
- Ensure REST API is enabled (Settings → Permalinks)

### Products not showing
- Verify WooCommerce is installed and activated
- Check that products are published and not in draft
- Ensure REST API is accessible at `/wp-json/wc/v3/products`

## 🚀 Next Steps

1. ✅ Setup WordPress with JWT plugin
2. ✅ Update `.env.local` with your URL and secret
3. Install dependencies (fetch is built-in, no new packages needed)
4. Update your pages to use the new hooks instead of mock data
5. Test login/logout flow
6. Implement cart checkout with orders

---

**Need help?** Check WordPress REST API docs: https://developer.wordpress.org/rest-api/
