import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated and validate token
    const checkAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        
        if (currentUser) {
          // Validate the token is still valid
          const isTokenValid = await authService.validateToken();
          
          if (!isTokenValid) {
            await authService.signOut();
            setUser(null);
          } else {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Set up periodic token validation
    // Tokens expire after 10 hours, so we check every 9 hours to catch expiration before it happens
    const tokenCheckInterval = setInterval(async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        const isTokenValid = await authService.validateToken();
        if (!isTokenValid) {
          await authService.signOut();
          setUser(null);
          // Redirect to login with session expired flag
          window.location.href = '/login?session_expired=true';
        }
      }
    }, 9 * 60 * 60 * 1000); // Check every 9 hours (32400000ms) - tokens expire after 10 hours

    // Cleanup interval on unmount
    return () => clearInterval(tokenCheckInterval);
  }, []);

  // Sign in handler
  const signIn = async (credential) => {
    try {
      setLoading(true);
      const user = await authService.signIn(credential);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out handler
  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      
      // Force page reload to ensure complete cleanup and prevent any cached state
      // This ensures the user will be required to sign in again
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, clear the user state and redirect
      setUser(null);
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  };

  // Mock login for development
  const mockLogin = (role) => {
    try {
      setLoading(true);
      const user = authService.mockLogin(role);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Error mock login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Direct login handler
  const directLogin = (email, role = 'CEO') => {
    try {
      setLoading(true);
      const user = authService.directLogin(email, role);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Error direct login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Debug OAuth handler
  const debugOAuth = () => {
    return authService.debugOAuth();
  };

  // Context value
  const value = {
    user,
    loading,
    signIn,
    signOut,
    mockLogin,
    directLogin,
    debugOAuth,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 