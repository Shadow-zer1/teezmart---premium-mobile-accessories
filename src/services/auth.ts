import {
  wordpressLogin,
  getMe,
  clearInternalJwtToken,
  getWooCustomerDetails
} from './wordpress';

export interface AuthResponse {
  token: string;
  id: number;
  username: string;
  display_name: string;
  email: string;
  first_name: string;
  avatar_urls?: Record<string, string>;
  meta_data?: any[];
}

export interface WooCustomerMetaData {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country?: string;
  email?: string;
  phone?: string;
}

export const authService = {
  async login(identifier: string, password: string): Promise<AuthResponse> {
    // 1. LOGIN - 'identifier' can be an email or a username
    // trims it to prevent hidden space errors
    const loginRes = await wordpressLogin({
      username: identifier.trim(),
      password
    });

    if (!loginRes.success || !loginRes.data) {
      // Better error messaging for the user
      throw new Error(loginRes.error?.message || 'Invalid username or password');
    }

    const data = loginRes.data;

    // 2. TARGETED TOKEN EXTRACTION
    const rawToken = data.extras?.jwt_token || data.token || data.jwt_token;

    if (!rawToken) {
      throw new Error('Authentication failed: Token not found.');
    }

    // 3. CLEAN AND SAVE
    const cleanToken = String(rawToken).replace(/['"]+/g, '').trim();
    localStorage.setItem('teezmart_token', cleanToken);

    // 4. BUILD & SAVE basic user data immediately so navbar shows name right away
    let fullUserData: AuthResponse = {
      token: cleanToken,
      id: parseInt(data.user_id) || 0,
      username: data.user_nicename || identifier,
      display_name: data.display_name || identifier,
      email: data.user_email || '',
      first_name: data.first_name || data.display_name || identifier,
      avatar_urls: data.avatar_urls,
      meta_data: []
    };
    localStorage.setItem('teezmart_user', JSON.stringify(fullUserData)); // navbar renders immediately

    // 5. FETCH FULL PROFILE then overwrite with complete data
    try {
      const userRes = await getMe(cleanToken); // saves token without delay

      if (userRes.success && userRes.data) {
        const wpData = userRes.data as any;
        const wooRes = await getWooCustomerDetails(wpData.id);

        fullUserData = {
          ...fullUserData,
          id: wpData.id,
          username: wpData.username || fullUserData.username,
          display_name: wpData.name || wpData.display_name || fullUserData.display_name,
          meta_data: wooRes.success ? wooRes.data.meta_data : [],
        };
      }
    } catch (e) {
      console.warn("Profile sync skipped.");
    }

    localStorage.setItem('teezmart_user', JSON.stringify(fullUserData)); // overwrites with full user data
    return fullUserData;
  },

  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    // 6. IMPORT register from wordpress.ts or use wpFetch directly
    //to bypass the 404 this talks to Railway WP URL
    const { register: wpRegister } = await import('./wordpress');

    const regRes = await wpRegister({
      email,
      username,
      password,
      first_name: username, // Using username as a fallback for first name
      last_name: ''
    });

    if (!regRes.success) {
      throw new Error(regRes.error?.message || 'Registration failed.');
    }

    // 7. After successful registration, log the user in to get the JWT token
    return this.login(username, password);
  },

  logout() {
    localStorage.removeItem('teezmart_token');
    localStorage.removeItem('teezmart_user');
    clearInternalJwtToken();
  },

  getCurrentUser(): AuthResponse | null {
    const userJson = localStorage.getItem('teezmart_user');
    const token = localStorage.getItem('teezmart_token');
    if (!userJson || !token) return null;
    try {
      return JSON.parse(userJson);
    } catch (e) {
      return null;
    }
  },
  updateLocalUser: (userData: any) => {
    localStorage.setItem('teezmart_user', JSON.stringify(userData));
  }
};