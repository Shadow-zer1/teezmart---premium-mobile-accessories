import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  const WP_URL = process.env.VITE_WORDPRESS_URL;
  const WOO_CK = process.env.VITE_WC_CONSUMER_KEY;
  const WOO_CS = process.env.VITE_WC_CONSUMER_SECRET;

  if (!WP_URL || !WOO_CK || !WOO_CS) {
    return res.status(500).json({ message: 'Server configuration error: Missing API keys.' });
  }

  const credentials = Buffer.from(`${WOO_CK}:${WOO_CS}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`
  };

  try {
    if (req.method === 'GET') {
      const customerId = req.query.customer as string;
      if (!customerId) {
        return res.status(400).json({ message: 'Customer ID is required.' });
      }

      // Construct query parameters for WooCommerce API
      const searchParams = new URLSearchParams();
      searchParams.append('customer', customerId);
      // Pass any other parameters from the frontend to WooCommerce
      if (req.query.status) searchParams.append('status', req.query.status as string);
      if (req.query.per_page) searchParams.append('per_page', req.query.per_page as string);
      if (req.query.page) searchParams.append('page', req.query.page as string);

      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';

      const response = await fetch(`${WP_URL}/wp-json/wc/v3/orders${query}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error: any) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  }
}
