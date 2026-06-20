import { useState, useCallback, useEffect } from 'react';
import {
  login as wpLogin,
  register as wpRegister,
  logout as wpLogout,
  getMe,
  getStoredUser,
  getToken,
} from '../services/wordpress';
import type { WpUser, LoginRequest } from '../services/wordpress';

interface AuthState {
  user: WpUser | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export function useWpAuth() {
  const [state, setState] = useState<AuthState>({
    user: getStoredUser(),
    isLoading: false,
    error: null,
    isAuthenticated: !!getToken(),
  });

  // Check if user is still logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (getToken()) {
        const response = await getMe();
        if (response.success && response.data) {
          setState(prev => ({
            ...prev,
            user: response.data,
            isAuthenticated: true,
          }));
        } else {
          wpLogout();
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            user: null,
          }));
        }
      }
    };

    checkAuth();
  }, []);

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const response = await wpLogin(credentials);

    if (response.success) {
      const userResponse = await getMe();
      if (userResponse.success && userResponse.data) {
        setState(prev => ({
          ...prev,
          user: userResponse.data,
          isAuthenticated: true,
          isLoading: false,
        }));
        return { success: true };
      }
    }

    setState(prev => ({
      ...prev,
      error: response.error?.message || 'Login failed',
      isLoading: false,
    }));
    return { success: false, error: response.error?.message };
  }, []);

  const handleRegister = useCallback(
    async (userData: {
      username: string;
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
    }) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await wpRegister(userData);

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
        }));
        return { success: true };
      }

      setState(prev => ({
        ...prev,
        error: response.error?.message || 'Registration failed',
        isLoading: false,
      }));
      return { success: false, error: response.error?.message };
    },
    []
  );

  const handleLogout = useCallback(() => {
    wpLogout();
    setState({
      user: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });
  }, []);

  return {
    ...state,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}
