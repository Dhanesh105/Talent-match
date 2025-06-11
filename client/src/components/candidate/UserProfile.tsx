import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { JobApplication } from '../../types';
import './UserProfile.css';

const UserProfile: React.FC = () => {
  const { authState } = useAuth();
  const { user } = authState;
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserApplications = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        // Assuming there's an endpoint to get user applications
        const response = await api.get('/applications/me');
        setApplications(response.data.data || []);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch your applications');
        setIsLoading(false);
        // For demo purposes, set empty applications array
        setApplications([]);
      }
    };

    fetchUserApplications();
  }, [user]);

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'hired': return 'status-hired';
      case 'shortlisted': return 'status-shortlisted';
      case 'rejected': return 'status-rejected';
      case 'reviewed': return 'status-reviewed';
      default: return 'status-pending';
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="login-message">
          <h2>Access Required</h2>
          <p>Please log in to view your profile</p>
          <a href="/login" className="primary-button">Log In</a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <p>View and manage your profile and job applications</p>
      </div>

      <div className="profile-content">
        {/* User Profile Card */}
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-role">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            
            <div className="profile-details">
              <div className="profile-detail">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="profile-detail">
                <span className="detail-label">Joined</span>
                <span className="detail-value">{formatDate(user.createdAt)}</span>
              </div>
              {/* Add more profile details as needed */}
            </div>
            
            <button className="profile-edit-button">
              Edit Profile
            </button>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{applications.length}</span>
              <span className="stat-label">Applications</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {applications.filter(app => app.status === 'shortlisted' || app.status === 'hired').length}
              </span>
              <span className="stat-label">Shortlisted</span>
            </div>
          </div>
        </div>
        
        {/* Applications Section */}
        <div className="applications-section">
          <h2 className="section-title">My Applications</h2>
          
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading your applications...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-applications">
              <div className="empty-illustration">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4169e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
              </div>
              <h3>No Applications Yet</h3>
              <p>You haven't applied for any jobs yet.</p>
              <a href="/jobs" className="primary-button">Browse Jobs</a>
            </div>
          ) : (
            <div className="application-cards">
              {applications.map((application) => (
                <div key={application._id} className="application-card">
                  <div className="card-header">
                    <h3 className="job-title">
                      {typeof application.job === 'string' 
                        ? 'Loading...' 
                        : application.job.title}
                    </h3>
                    <span className={`status-badge ${getStatusClass(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="company-info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"></path>
                    </svg>
                    <span>
                      {typeof application.job === 'string' 
                        ? 'Loading...' 
                        : application.job.companyName}
                    </span>
                  </div>
                  
                  <div className="application-details">
                    <div className="detail-item">
                      <span className="detail-label">Applied On</span>
                      <span className="detail-value">{formatDate(application.createdAt)}</span>
                    </div>
                    
                    {application.matchScore !== undefined && (
                      <div className="detail-item">
                        <span className="detail-label">Match Score</span>
                        <div className="match-score">
                          <div 
                            className="score-bar">
                            <div 
                              className="score-fill" 
                              style={{ width: `${Math.min(application.matchScore * 10, 100)}%` }}
                            ></div>
                          </div>
                          <span>{application.matchScore}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-actions">
                    <button className="action-button view-button">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
