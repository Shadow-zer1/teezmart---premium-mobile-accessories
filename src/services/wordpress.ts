// Wp GraphiQL Data Retrival Service for variable product

export const gqlQuery = async (query: string, variables = {}) => {
  const response = await fetch(`${WP_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const result = await response.json();
  if (result.errors) {
    console.error('GraphQL Errors:', result.errors);
    throw new Error(result.errors[0].message);
  }
  return result.data;
};

// ─── Types ────────────────────────────────────────────────────────────────────

/** One variation node exactly as WPGraphQL returns it */
interface GQLVariationNode {
  databaseId: number;
  price: string | null;           // e.g. "₨&nbsp;4,000"
  image: { sourceUrl: string } | null;
  attributes: {
    nodes: Array<{ name: string; value: string }>;
  };
}

/**
 * Normalised variation — shape that ProductDetail's selectedVariation logic
 * already expects (mirrors the old REST /wc/v3/products/:id/variations shape).
 */
export interface NormalizedVariation {
  id: number;
  /** Plain numeric string, e.g. "4000" */
  price: string;
  display_price: string;          // same value — used by the price block
  display_regular_price: string;  // empty string when GQL has no regularPrice
  regular_price: string;
  stock_status: 'instock' | 'outofstock';
  /** image.src — mirrors REST field name so ProductDetail image swap works */
  image: { src: string };
  /**
   * attributes[].option — mirrors REST field name so the variation-matching
   * logic in ProductDetail (`attr.option`) works without changes.
   * `name` keeps the raw slug ("test-1", "pa_color", etc.).
   */
  attributes: Array<{ name: string; option: string }>;
}

export const getShippingMethodsGQL = async () => {
  const query = `
    query GetShippingMethods {
      shippingZones {
        nodes {
          id
          name
          methods {
            nodes {
              id
              methodId
              title
              description
              enabled
              settings {
                nodes {
                  key
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await gqlQuery(query);
    const zones = result.data?.shippingZones?.nodes || [];
    const allMethods: any[] = [];

    zones.forEach((zone: any) => {
      (zone.methods?.nodes || []).forEach((method: any) => {
        const settings: any = {};
        (method.settings?.nodes || []).forEach((setting: any) => {
          settings[setting.key] = { value: setting.value };
        });

        allMethods.push({
          id: method.id,
          method_id: method.methodId,
          method_title: method.title,
          method_description: method.description,
          enabled: method.enabled,
          settings,
        });
      });
    });

    return { success: true, data: allMethods };
  } catch (error) {
    console.error('GraphQL shipping methods fetch failed:', error);
    return { success: false, error: error.message };
  }
};

// ─── Price helper ─────────────────────────────────────────────────────────────

/**
 * Strip HTML entities (₨&nbsp; etc.) and every non-digit/dot character,
 * then return a plain numeric string: "₨&nbsp;4,000" → "4000".
 */
function parseGQLPrice(raw: string | null | undefined): string {
  if (!raw) return '0';
  const cleaned = raw
    .replace(/&[a-z#0-9]+;/gi, '') // &nbsp; &amp; &#160; …
    .replace(/[^\d.]/g, '')         // currency symbols, commas, spaces
    .trim();
  return cleaned || '0';
}

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Fetches ALL variations for any variable product by slug via GraphQL.
 *
 * Works with any number of attributes and any attribute names — the GQL query
 * asks for every attribute node dynamically, so no per-product configuration
 * is needed.
 *
 * Returns an empty array for simple products (no VariableProduct fragment).
 */
export const getProductBySlugGQL = async (slug: string): Promise<NormalizedVariation[]> => {
  const query = `
    query GetVariations($slug: ID!) {
      product(id: $slug, idType: SLUG) {
        ... on VariableProduct {
          variations(first: 100) {
            nodes {
              databaseId
              price
              image {
                sourceUrl
              }
              attributes {
                nodes {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await gqlQuery(query, { slug });

  // Simple products return a product without the VariableProduct fragment
  const nodes: GQLVariationNode[] = data?.product?.variations?.nodes ?? [];

  return nodes.map((node): NormalizedVariation => {
    const numericPrice = parseGQLPrice(node.price);

    return {
      id: node.databaseId,
      price: numericPrice,
      display_price: numericPrice,
      display_regular_price: '',  // GQL schema has no regularPrice field
      regular_price: numericPrice,
      stock_status: 'instock',    // GQL schema has no stockStatus field
      image: {
        // sourceUrl  →  src  so ProductDetail's image.src references work
        src: node.image?.sourceUrl ?? '',
      },
      attributes: node.attributes.nodes.map((attr) => ({
        name: attr.name,   // raw slug: "test-1", "pa_color", etc.
        option: attr.value, // selected value: "val1", "Red", etc.
      })),
    };
  });
};

// --------------------------------------------------------------

// Safe access to environment variables
const metaEnv = (import.meta as any).env || {};
export const WP_URL = (metaEnv.VITE_WORDPRESS_URL || 'https://wordpress-production-27ad.up.railway.app').replace(/\/$/, '');
const API_BASE = `${WP_URL}/wp-json`;
const WOO_CK = metaEnv.VITE_WOO_CK || metaEnv.VITE_WC_CONSUMER_KEY || '';
const WOO_CS = metaEnv.VITE_WOO_CS || metaEnv.VITE_WC_CONSUMER_SECRET || '';

/**
 * Create basic auth header for WooCommerce API
 */
function getWooCommerceAuth() {
  if (!WOO_CK || !WOO_CS) return '';
  const credentials = `${WOO_CK}:${WOO_CS}`;
  const encoded = btoa(credentials);
  return `Basic ${encoded}`;
}

interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/** --- Internal JWT Token Management (used by wpFetch) --- */
// These are separate from the app's AuthContext token management
// to allow wpFetch to work independently if needed, but AuthContext
// will be the primary interface for the app.
export const getInternalJwtToken = (): string | null => {
  // Ensuring we use the same key used during your miniOrange test
  return localStorage.getItem('teezmart_token') || localStorage.getItem('wp_jwt_token');
};

export const setInternalJwtToken = (token: string): void => {
  localStorage.setItem('teezmart_token', token);
};

export const clearInternalJwtToken = (): void => {
  localStorage.removeItem('teezmart_token');
  localStorage.removeItem('wp_jwt_token');
};

/**
 * Generic fetch wrapper with JWT authorization
 */
async function wpFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  useWooAuth = false
): Promise<ApiResponse<T>> {
  if (!API_BASE && !endpoint.startsWith('http')) {
    return {
      success: false,
      error: { code: 'CONFIG_ERROR', message: 'WordPress URL not configured' }
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    // 1. Merge incoming headers first
    if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers)) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    // 2. PRIORITY CHECK: 
    // Only auto-inject token if Authorization isn't already set in the options
    if (!headers['Authorization']) {
      if (useWooAuth && WOO_CK && WOO_CS) {
        headers['Authorization'] = getWooCommerceAuth();
      } else {
        const rawToken = localStorage.getItem('teezmart_token');
        if (rawToken) {
          const cleanToken = rawToken.replace(/['"]+/g, '').trim();
          headers['Authorization'] = `Bearer ${cleanToken}`;
        }
      }
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    // ... rest of your existing response handling logic (isJson, etc.)
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      const error = isJson ? await response.json() : { message: 'Server error' };
      return {
        success: false,
        error: {
          code: error.code || 'ERROR',
          message: error.message || `API Error: ${response.statusText}`
        },
      };
    }

    const data = isJson ? await response.json() : null;
    return { success: true, data: data as T };

  } catch (err) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Network error' },
    };
  }
}

/**
 * USER AUTHENTICATION
 */

export interface WpUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_urls?: Record<string, string>;
  meta_data?: Array<{ id: number; key: string; value: string | number }>;
  billing?: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping?: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

/**
 * Performs a login request to WordPress JWT endpoint.
 */
export async function login(credentials: LoginRequest): Promise<ApiResponse<any>> {
  clearInternalJwtToken();

  // Add the 'X-Requested-With' header which CoCart often looks for to prevent CSRF
  const response = await wpFetch<any>('/cocart/v2/login', {
    method: 'POST',
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password
    }),
  });

  if (response.success && response.data) {
    // CoCart returns token as 'token' or 'jwt_token'
    const token = response.data.token || response.data.jwt_token;

    if (token) {
      setInternalJwtToken(token);
      // Note: teezmart_user is written by auth.ts after getMe() completes,
      // so we don't write it here to avoid overwriting with incomplete data.
    }
  }
  return response;
}

// Alias for the hook
export const wordpressLogin = login;


/**
 * Performs a registration request via the serverless proxy.
 */
export async function register(userData: any): Promise<ApiResponse<any>> {
  // Use the wc/v3/customers endpoint with Basic Auth (true)
  return wpFetch<any>('/wc/v3/customers', {
    method: 'POST',
    body: JSON.stringify({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
    }),
  }, true); // The 'true' is critical—it uses your CK/CS keys to allow user creation
}
/**
 * Clears all auth data.
 */
export function logout(): void {
  localStorage.removeItem('teezmart_token');
  localStorage.removeItem('teezmart_user');
  clearInternalJwtToken();
}

export const getToken = getInternalJwtToken;


/**
 * Validates the current JWT token
 */
export async function validateJwtToken(): Promise<ApiResponse<any>> {
  return wpFetch<any>('/api/v1/token-validate', { method: 'POST' });
}

/**
 * Fetches the current authenticated user's details from WordPress.
 */

export async function getMe(passedToken?: string): Promise<ApiResponse<WpUser>> {
  const token = passedToken || localStorage.getItem('teezmart_token');
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token.replace(/['"]+/g, '').trim()}`;
  }

  return wpFetch<WpUser>('/wp/v2/users/me?context=edit', {
    method: 'GET',
    headers: headers
  });
}

/**
 * Triggers a password reset email via the WordPress REST API.
 */
export async function forgotPassword(email: string): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();
    formData.append('user_login', email);
    formData.append('action', 'lostpassword');

    const response = await fetch(`${WP_URL}/wp-login.php?action=lostpassword`, {
      method: 'POST',
      body: formData,
    });

    // This endpoint usually redirects on success rather than returning JSON
    return { success: response.ok };
  } catch (err) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: 'Failed to send request' } };
  }
}
/**
 * Sets a new password using the reset code received via email.
 */
/**
 * Sets a new password using the 6-digit OTP code.
 */
export async function resetPassword(email: string, otp: string, password: string): Promise<ApiResponse<any>> {
  try {
    // We use ${WP_URL} so it talks to your Railway WordPress site
    const res = await fetch(`${WP_URL}/wp-json/app/v1/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        otp: otp,       // This matches our PHP code key
        password: password
      }),
    });

    const contentType = res.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await res.json() : {};

    return {
      success: res.ok,
      data,
      error: !res.ok ? { code: 'OTP_ERROR', message: data.message || 'Invalid or Expired Code' } : undefined
    };
  } catch (err: any) {
    return { success: false, error: { code: 'NETWORK_ERROR', message: err.message } };
  }
}

/**
 * Refreshes the CoCart JWT token.
 */
export async function refreshCocartToken(refreshToken: string): Promise<ApiResponse<any>> {
  return wpFetch<any>('/cocart/jwt/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/**
 * Updates the current authenticated user's profile info in WordPress.
 */
// src/services/wordpress.ts

// src/services/wordpress.ts

export async function updateMe(data: any): Promise<ApiResponse<any>> {
  // 1. Get the current user ID from local storage
  const stored = localStorage.getItem('teezmart_user');
  const storedUser = stored ? JSON.parse(stored) : null;
  const userId = storedUser?.id || storedUser?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: { code: 'no_id', message: 'User session expired. Please log in again.' }
    };
  }

  // 2. We use /wc/v3/customers/{id} instead of /wp/v2/users/me
  // 3. We set 'true' for Basic Auth (Consumer Keys) to bypass the 401
  return wpFetch<any>(`/wc/v3/customers/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email
    })
  }, true);
}
/**
 * Fetches full WooCommerce customer details by ID (requires Basic Auth).
 */
export async function getWooCustomerDetails(id: number): Promise<ApiResponse<any>> {
  return wpFetch<any>(`/wc/v3/customers/${id}`, {
    method: 'GET',
  }, true); // Requires Basic Auth
}

/**
 * WOOCOMMERCE PRODUCTS
 */

export interface WooCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: {
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  } | null;
  menu_order: number;
  count: number;
}

export interface WooProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: string;
  status: string;
  featured: boolean;
  catalog_visibility: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: string;
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: string;
  backorders_allowed: boolean;
  backordered: boolean;
  sold_individually: boolean;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  related_ids: number[];
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
  images: Array<{
    id: number;
    date_created: string;
    date_created_gmt: string;
    date_modified: string;
    date_modified_gmt: string;
    src: string;
    name: string;
    alt: string;
  }>;
  attributes: Array<{
    id: number;
    name: string;
    position: number;
    visible: boolean;
    variation: boolean;
    options: string[];
  }>;
  default_attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  meta_data: Array<{ id: number; key: string; value: string | number }>;
}

export interface WooReview {
  id: number;
  date_created: string;
  date_created_gmt: string;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  reviewer_avatar_urls: Record<string, string>;
}

export interface CreateReviewRequest {
  product_id: number;
  review: string;
  reviewer: string;
  reviewer_email: string;
  rating: number;
}

/**
 * Get all products with optional filters
 */
export async function getProducts(params?: {
  page?: number;
  per_page?: number;
  search?: string;
  category?: number;
  on_sale?: boolean;
  slug?: string;
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  order?: 'asc' | 'desc';
}): Promise<ApiResponse<WooProduct[]>> {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
  }
  const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
  return wpFetch<WooProduct[]>(`/wc/v3/products${query}`, {}, true);
}

/**
 * Get single product
 */
export async function getProduct(productId: number | string): Promise<ApiResponse<WooProduct>> {
  return wpFetch<WooProduct>(`/wc/v3/products/${productId}`, {}, true);
}

/**
 * Get product categories
 */
export async function getProductCategories(): Promise<ApiResponse<WooCategory[]>> {
  return wpFetch<WooCategory[]>('/wc/v3/products/categories', {}, true);
}

/**
 * TI WISHLIST API
 */
export async function getWishlist(): Promise<ApiResponse<any>> {
  return wpFetch<any>('/tinvwl/v1/wishlist/get', { method: 'GET' }, false);
}

export async function addToWishlistAPI(productId: number): Promise<ApiResponse<any>> {
  return wpFetch<any>('/tinvwl/v1/wishlist/add', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId })
  }, false);
}

/**
 * WOOCOMMERCE ORDERS
 */

export interface WooOrder {
  id: number;
  parent_id: number;
  number: string;
  order_key: string;
  created_via: string;
  version: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  discount_tax: string;
  shipping_total: string;
  shipping_tax: string;
  cart_tax: string;
  total: string;
  total_tax: string;
  prices_include_tax: boolean;
  customer_id: number;
  customer_ip_address: string;
  customer_user_agent: string;
  customer_note: string;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  transaction_id: string;
  date_paid: string | null;
  date_completed: string | null;
  cart_hash: string;
  meta_data: Array<{ id?: number; key: string; value: string | number }>;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    taxes: Array<{ id: number; total: string; subtotal: string }>;
    meta_data: Array<{ id: number; key: string; value: string }>;
    sku: string;
    price: number;
  }>;
  tax_lines: any[];
  shipping_lines: any[];
  fee_lines: any[];
  coupon_lines: any[];
  refunds: any[];
}

// coupone function
/**
 * Validate a coupon code against WooCommerce rules
 */
export async function validateCoupon(code: string): Promise<ApiResponse<any>> {
  const res = await wpFetch<any[]>(`/wc/v3/coupons?code=${code.toLowerCase()}`, {}, true);
  if (res.success && res.data && res.data.length > 0) return { success: true, data: res.data[0] };
  return { success: false, error: { code: '404', message: 'Invalid Code' } };
}


// feature check function

export async function getStoreSettings(): Promise<ApiResponse<any[]>> {
  return wpFetch<any[]>('/wc/v3/settings/general', {}, true);
}

export async function getTaxRates(): Promise<ApiResponse<any[]>> {
  return wpFetch<any[]>('/wc/v3/taxes', {}, true);
}

// order notes fucntion
export async function addOrderNote(orderId: number, note: string): Promise<ApiResponse<any>> {
  return wpFetch<any>(`/wc/v3/orders/${orderId}/notes`, {
    method: 'POST',
    body: JSON.stringify({
      note: note,
      customer_note: false // 'false' makes it a private internal note for the sidebar
    }),
  }, true);
}


export async function getOrders(params?: { page?: number; per_page?: number }): Promise<ApiResponse<WooOrder[]>> {
  // Get user ID directly from localStorage — no extra API call needed
  const stored = localStorage.getItem('teezmart_user');
  const storedUser = stored ? JSON.parse(stored) : null;
  const customerId = storedUser?.id;

  if (!customerId) {
    return { success: false, error: { code: 'auth_error', message: 'Not authenticated' } };
  }

  const searchParams = new URLSearchParams({
    customer: String(customerId),
    page: String(params?.page ?? 1),
    per_page: String(params?.per_page ?? 20),
  });

  return wpFetch<WooOrder[]>(`/wc/v3/orders?${searchParams.toString()}`, {}, true);
}

export async function updateCustomer(id: number, data: any): Promise<ApiResponse<any>> {
  return wpFetch<any>(`/wc/v3/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true);
}

/**
 * Create order
 */
export async function createOrder(orderData: Partial<WooOrder>): Promise<ApiResponse<WooOrder>> {
  return wpFetch<WooOrder>('/wc/v3/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }, true);
}

/**
 * Update order
 */
export async function updateOrder(
  orderId: number,
  orderData: Partial<WooOrder>
): Promise<ApiResponse<WooOrder>> {
  return wpFetch<WooOrder>(`/wc/v3/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify(orderData),
  }, true);
}

/**
 * Get active payment gateways
 */
export interface WooPaymentGateway {
  id: string;
  title: string;
  description: string;
  enabled: boolean | string;
  settings?: {
    // Adding index signature so TS doesn't complain about dynamic keys
    [key: string]: any;
    account_details?: { value: any[] };
    accounts?: { value: any[] };
  };
}

export async function getPaymentGateways(): Promise<ApiResponse<WooPaymentGateway[]>> {
  return wpFetch<WooPaymentGateway[]>('/wc/v3/payment_gateways', {}, true);
}

/**
 * Get site notifications (using WP Posts filtered by category/tag)
 */
export async function getSiteNotifications(): Promise<ApiResponse<any[]>> {
  // The REST API requires a numeric ID for categories. Using a general fetch
  // for latest posts to prevent 400 Bad Request. 
  // To filter by a specific category, replace '1' with your category's numeric ID.
  return wpFetch<any[]>('/wp/v2/posts?per_page=5&_fields=title,content', {}, false);
}

/**
 * Get shipping methods from a specific zone (defaults to Zone 1)
 * The general /shipping_methods endpoint only returns definitions, not rates.
 */
export async function getShippingMethods(zoneId: number = 1): Promise<ApiResponse<any[]>> {
  return wpFetch<any[]>(`/wc/v3/shipping/zones/${zoneId}/methods`, {}, true);
  return wpFetch<any[]>(`/wc/v3/shipping/zones/${zoneId}/shipping-methods`, {}, true);
}

/**
 * Get product reviews
 */
export async function getProductReviews(productId: number): Promise<ApiResponse<WooReview[]>> {
  return wpFetch<WooReview[]>(`/wc/v3/products/reviews?product=${productId}`, {}, true);
}

/**
 * Create product review
 */
export async function createProductReview(reviewData: CreateReviewRequest): Promise<ApiResponse<WooReview>> {
  return wpFetch<WooReview>('/wc/v3/products/reviews', {
    method: 'POST',
    body: JSON.stringify(reviewData),
  }, true);
}

/**
 * WOOCOMMERCE CART
 */

export async function addToCart(params: {
  product_id: number;
  quantity: number;
}): Promise<ApiResponse<any>> {
  return wpFetch('/wc/store/v1/cart/add-item', {
    method: 'POST',
    body: JSON.stringify(params),
  }, true);
}

export async function getCart(): Promise<ApiResponse<any>> {
  return wpFetch('/wc/store/v1/cart', {}, true);
}

export async function removeFromCart(itemKey: string): Promise<ApiResponse<any>> {
  return wpFetch(`/wc/store/v1/cart/remove-item?key=${itemKey}`, {
    method: 'POST',
  }, true);
}

/**
 * COCART V2 API (Enhanced Cart Management)
 */

/**
 * Fetches the current user's cart from CoCart.
 */
export async function getCocartCart(): Promise<ApiResponse<any>> {
  return wpFetch<any>('/cocart/v2/cart', { method: 'GET' }, false);
}

/**
 * Adds an item to the CoCart cart.
 */
export async function addToCocartCart(productId: string, quantity: number, itemData: any = {}): Promise<ApiResponse<any>> {
  return wpFetch<any>('/cocart/v2/cart/add-item', {
    method: 'POST',
    body: JSON.stringify({
      id: productId,
      quantity: quantity.toString(),
      item_data: itemData
    }),
  }, false);
}

/**
 * Removes an item from the CoCart cart using its item key.
 */
export async function removeFromCocartCart(itemKey: string): Promise<ApiResponse<any>> {
  return wpFetch<any>(`/cocart/v2/cart/item/${itemKey}`, {
    method: 'DELETE',
  }, false);
}

/**
 * Clears the entire CoCart cart.
 */
export async function clearCocartCart(): Promise<ApiResponse<any>> {
  return wpFetch<any>('/cocart/v2/cart/clear', {
    method: 'POST',
  }, false);
}

/**
 * HELPER: Get user data from local storage
 */
export function getStoredUser() {
  const stored = localStorage.getItem('teezmart_user');
  return stored ? JSON.parse(stored) : null;
}

// cancle order functuon

export async function updateOrderStatus(orderId: number, status: 'cancelled') {
  return wpFetch<any>(`/wc/v3/orders/${orderId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }, true); // The 'true' is the master key so it doesn't fail
}

// order taracking function

/**
 * Optimized Order Tracking Function
 * Uses the existing authenticated service logic
 */
export const getOrderDirect = async (orderId: string, email: string): Promise<any> => {
  // 1. Use the existing WP_URL and WooCommerce Auth from the top of this file
  const auth = getWooCommerceAuth();

  try {
    // 2. Using native fetch to keep it consistent with your wpFetch wrapper
    const response = await fetch(`${WP_URL}/wp-json/wc/v3/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error(`Order not found: ${response.statusText}`);
    }

    const order = await response.json();

    // 3. Security: Double check the email matches the order
    const billingEmail = order.billing?.email?.toLowerCase();
    if (billingEmail !== email.toLowerCase().trim()) {
      throw new Error("Email mismatch");
    }

    // 4. Extract tracking info if it exists in meta_data
    const trackingNumber = order.meta_data?.find((m: any) => m.key === '_tracking_number')?.value;

    return {
      ...order,
      tracking_id: trackingNumber || `TM-${order.id}-${order.number}`,
    };
  } catch (error) {
    console.error("Order Tracking Service Error:", error);
    throw error;
  }
};