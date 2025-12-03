'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import { login as apiLogin } from '@/services/api';

interface User {
  id: string;
  name: string;
  role: 'admin' | 'supervisor' | 'operario';
  employeeId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<any>(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setUser({ id: decoded.sub, name: decoded.name, role: decoded.role, employeeId: decoded.employeeId });
          setToken(storedToken);
        } else {
          // Token expirado
          localStorage.removeItem('access_token');
        }
      } catch (error) {
        console.error("Failed to decode token", error);
        localStorage.removeItem('access_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: any) => {
    const { access_token } = await apiLogin(credentials);
    const decoded = jwtDecode<any>(access_token);
    
    setUser({ id: decoded.sub, name: decoded.name, role: decoded.role, employeeId: decoded.employeeId });
    setToken(access_token);
    localStorage.setItem('access_token', access_token);
    
    // Redirigir según el rol
    if (decoded.role === 'operario') {
      router.push('/operario');
    } else {
      router.push('/supervisor');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
