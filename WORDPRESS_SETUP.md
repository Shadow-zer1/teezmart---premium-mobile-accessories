# 🛍️ WordPress Integration Guide (TeezMart)

This is just a quick guide on how I connected the React frontend with WordPress + WooCommerce using JWT auth and REST APIs.

Nothing fancy — just the setup I used to make everything talk to each other.

---

## 🔧 WordPress Setup

### 1. Install required plugins

In your WordPress dashboard:

Go to **Plugins → Add New**, and install these:

- JWT Authentication for REST API  
- WooCommerce  
- CORS Headers plugin  
- (Optional) WP REST Password Reset plugin  

---

### 2. Permalink setup

Go to:

Pick anything except **Plain**, then save.

(REST API won’t work properly otherwise.)

---

### 3. JWT setup

After installing the JWT plugin:

- Go to plugin settings
- Copy the secret key
- Make sure it matches your frontend `.env`

---

### 4. CORS fix (important)

If requests are blocked:

Install **CORS Headers plugin** and enable it.

Or allow manually:

Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: Authorization, Content-Type


---

## 🌍 Frontend Environment Setup

Create a `.env.local` file:

```env
VITE_WORDPRESS_URL=https://your-wordpress-site.com
VITE_WC_CONSUMER_KEY=your_key
VITE_WC_CONSUMER_SECRET=your_secret
VITE_BREVO_API_KEY=your_key
VITE_BREVO_LIST_ID=2