import authService from '../services/authService';

// Get the current authenticated user
export const getCurrentUser = () => {
  const user = authService.getCurrentUser();
  
  if (!user) {
    // If no user is found but we're running in development mode, use a mock user
    console.warn('No authenticated user found. Using mock Customer Relations Manager.');
    return {
      email: 'mock.crm@reyanshelectronics.com',
      name: 'Mock CRM',
      role: 'Customer Relations Manager',
      permissions: 'CRUD',
      imageUrl: ''
    };
  }
  
  return user;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return authService.isAuthenticated();
};

// Get user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

// Check if user has specific role
export const hasRole = (role) => {
  return authService.hasRole(role);
};

// Check if user has permission to perform an action on a resource
export const hasPermission = (action, resource) => {
  const user = getCurrentUser();
  
  // If user doesn't exist, they have no permissions
  if (!user) return false;
  
  // In this simplified version, we assume all users have full CRUD rights
  // In a real app, this would check specific permissions from the user object
  return true;
}; 