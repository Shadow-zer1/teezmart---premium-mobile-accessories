import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function (req: VercelRequest, res: VercelResponse) {
  const WP_URL = process.env.VITE_WORDPRESS_URL;
  const MO_API_KEY = process.env.VITE_MO_API_KEY;
  const MO_TOKEN_KEY = process.env.VITE_MO_TOKEN_KEY;
  const { action } = req.query;

  if (!WP_URL || !MO_API_KEY || !MO_TOKEN_KEY) {
    return res.status(500).json({ message: 'Server configuration error: Missing keys.' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-MO-API-KEY': MO_API_KEY,
    'X-MO-TOKEN-KEY': MO_TOKEN_KEY
  };

  try {
    if (action === 'generate') {
      const { email } = req.body;
      const response = await fetch(`${WP_URL}/wp-json/miniorange/v1/otp/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, otp_type: 'email' }),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } 
    
    if (action === 'validate') {
      const { email, code, password } = req.body;
      const response = await fetch(`${WP_URL}/wp-json/miniorange/v1/otp/validate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          email, 
          otp: code, 
          new_password: password 
        }),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ message: 'Invalid action.' });
  } catch (error: any) {
    console.error('OTP Proxy Error:', error);
    return res.status(500).json({ message: error.message || 'Internal server error.' });
  }
}