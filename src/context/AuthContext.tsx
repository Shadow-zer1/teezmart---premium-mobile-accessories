import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, AuthResponse, WooCustomerMetaData } from '../services/auth';

interface AuthContextType {
  user: AuthResponse | null;
  login: (u: string, p: string) => Promise<void>;
  register: (e: string, u: string, p: string) => Promise<void>;
  logout: () => void;
  updateLocalUser: (updatedUser: AuthResponse) => void; // Expose updateLocalUser
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);

  useEffect(() => {
    const savedUser = authService.getCurrentUser();
    if (savedUser) setUser(savedUser);
  }, []);

  const login = async (u: string, p: string) => {
    const userData = await authService.login(u, p);
    setUser(userData);
  };

  const register = async (e: string, u: string, p: string) => {
    const userData = await authService.register(e, u, p);
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateLocalUser = (updatedUser: AuthResponse) => {
    authService.updateLocalUser(updatedUser);
    setUser(updatedUser); // Updates the state as well
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateLocalUser, // Provides the function
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};