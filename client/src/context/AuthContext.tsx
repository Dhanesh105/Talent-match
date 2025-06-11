import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { AuthState, User } from '../types';

// Context interface
interface AuthContextType {
  authState: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
  });
  
  const navigate = useNavigate();

  // Check for token and load user on initial load
  useEffect(() => {
    console.log("AuthContext: Token state changed, current token:", authState.token ? "Token exists" : "No token");
    
    const loadUser = async () => {
      if (authState.token) {
        console.log("AuthContext: Loading user with existing token");
        setAuthState(prev => ({ ...prev, isLoading: true }));
        try {
          const userData = await authService.getUserProfile();
          console.log("AuthContext: User profile loaded, raw response:", userData);
          
          // Support both response formats
          const user = userData.user || userData;
          
          if (!user) {
            console.error("AuthContext: Invalid user profile response", userData);
            throw new Error("Invalid user profile data");
          }
          
          console.log("AuthContext: User data extracted:", user);
          
          setAuthState({
            user: user,
            token: authState.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error("AuthContext: Error loading user profile, clearing token", error);
          localStorage.removeItem('token');
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            error: 'Session expired. Please log in again.',
          });
        }
      } else {
        console.log("AuthContext: No token found, user must log in");
      }
    };

    loadUser();
  }, [authState.token]);

  // Login function
  const login = async (email: string, password: string) => {
    console.log("AuthContext: Attempting login for:", email);
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.login({ email, password });
      console.log("AuthContext: Login API response:", JSON.stringify(data));
      
      if (!data || !data.token) {
        console.error("AuthContext: Login failed - no token received");
        throw new Error("No authentication token received");
      }
      
      // Handle different response formats - the user might be at the top level or in user property
      const userData = data.user || data;
      
      if (!userData || typeof userData !== 'object') {
        console.error("AuthContext: Login response missing user information:", data);
        throw new Error("Invalid user data in response");
      }
      
      if (!userData.role) {
        console.error("AuthContext: Login response missing role information:", userData);
        throw new Error("User role not found");
      }
      
      // Clean up any sensitive data from user object
      const cleanUserData = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
      
      // Save the updated state
      const updatedState = {
        user: cleanUserData,
        token: data.token,
        isLoading: false,
        error: null,
      };
      
      console.log("AuthContext: Setting user state to:", JSON.stringify(cleanUserData));
      setAuthState(updatedState);
      
      // Force a small delay to ensure state is updated before redirection
      setTimeout(() => {
        const userRole = cleanUserData.role.toLowerCase();
        console.log("AuthContext: User role for redirection:", userRole);
        
        if (userRole === 'recruiter') {
          console.log('AuthContext: Navigating to /recruiter/dashboard');
          navigate('/recruiter/dashboard', { replace: true });
        } else {
          console.log('AuthContext: Navigating to /jobs');
          navigate('/jobs', { replace: true });
        }
        
        console.log('AuthContext: Navigation complete, checking current path:', window.location.pathname);
      }, 100);
    } catch (error: any) {
      console.error("AuthContext: Login error:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Login failed. Please try again.'
      }));
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string, role: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.register({ name, email, password, role });
      console.log("AuthContext: Register response:", data);
      
      if (!data || !data.token) {
        throw new Error("Registration failed");
      }
      
      // Handle different response formats just like in login
      const userData = data.user || data;
      
      if (!userData || typeof userData !== 'object') {
        console.error("AuthContext: Register response missing user data");
        throw new Error("Invalid user data in response");
      }
      
      // Clean up any sensitive data from user object
      const cleanUserData = {
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
      
      setAuthState({
        user: cleanUserData,
        token: data.token,
        isLoading: false,
        error: null,
      });
      
      // Redirect based on user role after a small delay
      setTimeout(() => {
        const userRole = cleanUserData.role.toLowerCase();
        
        if (userRole === 'recruiter') {
          navigate('/recruiter/dashboard', { replace: true });
        } else {
          navigate('/jobs', { replace: true });
        }
      }, 100);
    } catch (error: any) {
      console.error("AuthContext: Register error:", error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Registration failed. Please try again.'
      }));
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      error: null,
    });
    navigate('/login');
  };

  // Clear error function
  const clearError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
