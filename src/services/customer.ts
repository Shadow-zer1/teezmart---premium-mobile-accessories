// This is a serverless function (e.g., for Vercel or Netlify)
// It acts as a secure proxy for WooCommerce customer operations
// that require Consumer Key/Secret, without exposing them to the client.

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  const WP_URL = process.env.VITE_WORDPRESS_URL;
  const WOO_CK = process.env.VITE_WC_CONSUMER_KEY;
  const WOO_CS = process.env.VITE_WC_CONSUMER_SECRET;

  if (!WP_URL || !WOO_CK || !WOO_CS) {
    console.error('Serverless config error: WP_URL or WOO_CK/WOO_CS missing.');
    return res.status(500).json({ message: 'Server configuration error: Missing API keys.' });
  }

  const credentials = Buffer.from(`${WOO_CK}:${WOO_CS}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${credentials}`
  };

  try {
    let response;
    let data;

    switch (req.method) {
      case 'POST': // For registration
        const { email, username, password } = req.body;
        if (!email || !username || !password) {
          return res.status(400).json({ message: 'Email, username, and password are required.' });
        }
        response = await fetch(`${WP_URL}/wp-json/wc/v3/customers`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, username, password }),
        });
        data = await response.json();
        return res.status(response.status).json(data);

      case 'PUT': // For updating customer (e.g., addresses)
        const { id } = req.query; // Customer ID from URL parameter
        if (!id) {
          return res.status(400).json({ message: 'Customer ID is required for update.' });
        }
        response = await fetch(`${WP_URL}/wp-json/wc/v3/customers/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(req.body), // req.body can now contain billing, shipping, and meta_data
        });
        data = await response.json();
        return res.status(response.status).json(data);

      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error: any) {
    console.error('Serverless customer API error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error during customer operation.' });
  }
}