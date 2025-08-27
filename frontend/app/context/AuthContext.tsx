'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { serverUrl } from '@/lib/constants';
;  
// The AuthContext no longer needs useRouter or useSearchParams

const apiClient = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

interface AuthContextType {
  isLoggedIn: boolean;
  login: (token: string) => void;
  logout: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  isCompleteClose: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completeClose, setCompleteClose] = useState(false);

  // This simple effect is all that's needed now.
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  const login = (token: string) => {
    localStorage.setItem('accessToken', token);
    setIsLoggedIn(true);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await apiClient.post('/api/v1/users/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Backend logout failed, proceeding with client-side logout:", error);
    } finally {
      localStorage.removeItem('accessToken');
      setIsLoggedIn(false);
      window.location.href = '/auth';
    }
  };

  const toggleSidebar = () => {
    if (completeClose) {
      setCompleteClose(false);
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(prev => !prev);
    }
  };

  const closeSidebar = () => {
    setCompleteClose(true);
  };

  if (isLoading) {
    return null;
  }

  // The provider no longer renders the modal directly.
  return (
    
    <AuthContext.Provider value={{ isLoggedIn, login, logout, isSidebarOpen, toggleSidebar, closeSidebar, isCompleteClose: completeClose }}>
      {children}
    </AuthContext.Provider>
    
  );
};