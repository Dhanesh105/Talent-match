import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import React, { useEffect } from 'react';

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

// ProtectedRoute component for auth checking
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement, allowedRoles?: string[] }) => {
  const { authState } = useAuth();
  const { user, isLoading } = authState;

  // Enhanced debugging
  useEffect(() => {
    console.log("ProtectedRoute - Current user:", user);
    console.log("ProtectedRoute - User role:", user?.role);
    console.log("ProtectedRoute - Allowed roles:", allowedRoles);
    console.log("ProtectedRoute - Is user authorized:", allowedRoles ? (user ? allowedRoles.includes(user.role) : false) : true);
    console.log("ProtectedRoute - Path attempted:", window.location.pathname);
  }, [user, allowedRoles]);

  if (isLoading) {
    return <div className="container mx-auto py-8 text-center">Loading...</div>;
  }

  if (!user) {
    console.log("ProtectedRoute - No user, redirecting to login");
    return <Navigate to="/login" />;
  }

  // Normalize role comparison to prevent case sensitivity issues
  const hasRequiredRole = allowedRoles ? 
    allowedRoles.some(role => role.toLowerCase() === user.role?.toLowerCase()) : 
    true;

  if (allowedRoles && !hasRequiredRole) {
    console.log(`ProtectedRoute - User role (${user.role}) not in allowed roles, redirecting to appropriate dashboard`);
    return <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />;
  }

  return children;
};

// App Component
function AppContent() {
  const { authState } = useAuth();
  const { user } = authState;
  console.log("AppContent - Current user:", user);
  
  // Add effect to log auth state changes
  useEffect(() => {
    console.log("AppContent - Auth state changed, user:", user);
    console.log("AppContent - Current route:", window.location.pathname);
  }, [user]);
  
  return (
    <div className="min-h-screen bg-secondary">
      <Navbar />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            user ? (
              <>
                {console.log("Login Route - User exists, redirecting to appropriate dashboard")}
                <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />
              </>
            ) : (
              <>
                {console.log("Login Route - No user, showing login page")}
                <Login />
              </>
            )
          } />
          
          <Route path="/register" element={
            user ? (
              <>
                {console.log("Register Route - User exists, redirecting to appropriate dashboard")}
                <Navigate to={user.role?.toLowerCase() === 'recruiter' ? '/recruiter/dashboard' : '/jobs'} />
              </>
            ) : (
              <>
                {console.log("Register Route - No user, showing register page")}
                <Register />
              </>
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
          } />Manage
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
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;