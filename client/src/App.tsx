import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, createContext, useState, useContext, ReactNode } from 'react';

// Layout components
import Navbar from './components/layout/Navbar';
import RecruiterLayout from './components/layout/RecruiterLayout';

// Auth components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Job components
import JobList from './components/jobs/JobList';
import JobDetail from './components/jobs/JobDetail';

// Recruiter components
import RecruiterDashboard from './components/recruiter/RecruiterDashboard';
import RecruiterJobList from './components/recruiter/RecruiterJobList';
import RecruiterApplicationList from './components/recruiter/RecruiterApplicationList';
import JobForm from './components/recruiter/JobForm';
import JobCandidateList from './components/recruiter/JobCandidateList';

// Candidate components
import UserProfile from './components/candidate/UserProfile';

// Services and types
import { authService } from './services/api';
import { AuthState } from './types';

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

// Simple Auth Provider component without navigation
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
  });

  // Check for token and load user on initial load
  useEffect(() => {
    const loadUser = async () => {
      if (authState.token) {
        setAuthState(prev => ({ ...prev, isLoading: true }));
        try {
          const userData = await authService.getUserProfile();
          const user = userData.user || userData;
          
          setAuthState({
            user: user,
            token: authState.token,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          localStorage.removeItem('token');
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            error: 'Session expired. Please log in again.',
          });
        }
      }
    };

    loadUser();
  }, [authState.token]);

  // Login function
  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await authService.login({ email, password });
      
      if (!data || !data.token) {
        throw new Error("No authentication token received");
      }
      
      const userData = data.user || data;
      
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
      
      // Redirect will be handled by the route components
      window.location.href = cleanUserData.role.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs';
    } catch (error: any) {
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
      
      if (!data || !data.token) {
        throw new Error("Registration failed");
      }
      
      const userData = data.user || data;
      
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
      
      // Redirect will be handled by the route components
      window.location.href = cleanUserData.role.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs';
    } catch (error: any) {
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
    window.location.href = '/login';
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

// ProtectedRoute component for auth checking
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement, allowedRoles?: string[] }) => {
  const { authState } = useAuth();
  const { user, isLoading } = authState;

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const hasRequiredRole = allowedRoles ? 
    allowedRoles.some(role => role.toLowerCase() === user.role?.toLowerCase()) : 
    true;

  if (allowedRoles && !hasRequiredRole) {
    return <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />;
  }

  return children;
};

// App Component
function AppContent() {
  const { authState } = useAuth();
  const { user } = authState;
  
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            user ? (
              <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />
            ) : (
              <Login />
            )
          } />
          
          <Route path="/register" element={
            user ? (
              <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />
            ) : (
              <Register />
            )
          } />
          
          {/* Candidate routes */}
          <Route path="/jobs" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <JobList />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <JobDetail />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <UserProfile />
            </ProtectedRoute>
          } />

          {/* Recruiter routes with shared layout */}
          <Route path="/recruiter" element={
            <ProtectedRoute allowedRoles={['recruiter', 'admin']}>
              <RecruiterLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<RecruiterDashboard />} />
            <Route path="jobs" element={<RecruiterJobList />} />
            <Route path="jobs/new" element={<JobForm />} />
            <Route path="jobs/edit/:id" element={<JobForm />} />
            <Route path="jobs/:id/candidates" element={<JobCandidateList />} />
            <Route path="applications" element={<RecruiterApplicationList />} />
            <Route index element={<Navigate to="/recruiter/dashboard" replace />} />
          </Route>

          {/* Default route redirects based on user role */}
          <Route path="/" element={
            user 
              ? <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />
              : <Navigate to="/login" />
          } />
          
          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

// Wrapped with Auth Provider
function App(): React.ReactElement {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
