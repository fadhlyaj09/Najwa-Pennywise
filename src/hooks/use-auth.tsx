
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '@/lib/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  userEmail: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const token = localStorage.getItem('auth_token');
      const email = localStorage.getItem('user_email');
      if (token && email) {
        setIsAuthenticated(true);
        setUserEmail(email);
      }
    } catch (e) {
      console.error("Error accessing localStorage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const result = await authenticate(email.toLowerCase(), pass);
    if (result.success) {
      const lowercasedEmail = email.toLowerCase();
      setIsAuthenticated(true);
      setUserEmail(lowercasedEmail);
      localStorage.setItem('auth_token', 'fake-jwt-token');
      localStorage.setItem('user_email', lowercasedEmail);
      return { success: true };
    }
    return { success: false, message: result.message };
  };

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserEmail(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
