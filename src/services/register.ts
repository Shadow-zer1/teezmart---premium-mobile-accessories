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
    if (req.method === 'POST') {
      const { email, username, password } = req.body;
      if (!email || !username || !password) {
        return res.status(400).json({ message: 'Email, username, and password are required.' });
      }
      const response = await fetch(`${WP_URL}/wp-json/wc/v3/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  }
}