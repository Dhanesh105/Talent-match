import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar: React.FC = () => {
  const { authState, logout } = useAuth();
  const { user } = authState;
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-content">
          <Link to="/" className="navbar-logo">
            TalentMatch
          </Link>

          <div className="navbar-links">
            {user ? (
              <>
                {/* Shared navigation items for all logged-in users */}
                {user.role === 'candidate' ? (
                  <>
                    <Link to="/jobs" className="nav-link">
                      Find Jobs
                    </Link>
                    <Link to="/profile" className="nav-link">
                      My Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/recruiter/dashboard" className="nav-link">
                      Dashboard
                    </Link>
                    <Link to="/recruiter/applications" className="nav-link">
                      Manage applications
                    </Link>
                    <Link to="/recruiter/jobs/new" className="nav-link">
                      Post Job
                    </Link>
                  </>
                )}
                
                <div className="user-menu">
                  <span className="user-name">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="logout-button"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className={`auth-button ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`auth-button ${location.pathname === '/register' ? 'active' : ''}`}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
