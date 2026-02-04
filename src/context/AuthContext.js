import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();

        if (currentUser) {
          const isTokenValid = await authService.validateToken();
          if (isTokenValid) {
            setUser(currentUser);
          } else {
            await authService.signOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Periodic token validation (safe, non-blocking)
    const interval = setInterval(async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;

        const isTokenValid = await authService.validateToken();
        if (!isTokenValid) {
          await authService.signOut();
          setUser(null);
          window.location.href = '/login?session_expired=true';
        }
      } catch (err) {
        console.error('Periodic auth validation failed:', err);
      }
    }, 9 * 60 * 60 * 1000); // 9 hours

    return () => clearInterval(interval);
  }, []);

  // Google OAuth sign-in
  const signIn = async (credential) => {
    setLoading(true);
    try {
      const authenticatedUser = await authService.signIn(credential);
      setUser(authenticatedUser);
      return authenticatedUser;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
    } finally {
      setUser(null);
      setLoading(false);
      window.location.href = '/login';
    }
  };

  // Dev-only helpers (safe, optional)
  const mockLogin = (role) => {
    setLoading(true);
    try {
      const mockUser = authService.mockLogin(role);
      setUser(mockUser);
      return mockUser;
    } finally {
      setLoading(false);
    }
  };

  const directLogin = (email, role = 'CEO') => {
    setLoading(true);
    try {
      const directUser = authService.directLogin(email, role);
      setUser(directUser);
      return directUser;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    signIn,
    signOut,
    mockLogin,
    directLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

export default AuthContext;
