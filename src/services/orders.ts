import type { VercelRequest, VercelResponse } from '@vercel/node';

const WP_URL = (process.env.VITE_WORDPRESS_URL || 'https://wordpress-production-27ad.up.railway.app').replace(/\/$/, '');
const WOO_CK = process.env.VITE_WOO_CK || '';
const WOO_CS = process.env.VITE_WOO_CS || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify the user is authenticated via their JWT
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // First validate the JWT and get the user's WP ID
    const meRes = await fetch(`${WP_URL}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!meRes.ok) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const meData = await meRes.json();
    const customerId = meData.id;

    // Build query params — always scope to this customer
    const { page = 1, per_page = 20 } = req.query;
    const params = new URLSearchParams({
      customer: String(customerId),
      page: String(page),
      per_page: String(per_page),
    });

    // Fetch orders from WooCommerce using Basic Auth (consumer key/secret)
    const credentials = Buffer.from(`${WOO_CK}:${WOO_CS}`).toString('base64');
    const ordersRes = await fetch(`${WP_URL}/wp-json/wc/v3/orders?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    const orders = await ordersRes.json();

    if (!ordersRes.ok) {
      return res.status(ordersRes.status).json({ message: orders.message || 'Failed to fetch orders' });
    }

    return res.status(200).json(orders);
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error' });
  }
}
