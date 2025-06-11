import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services/api';
import { DashboardMetrics } from '../../types';
import './RecruiterStyles.css';

const RecruiterDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await dashboardService.getDashboardMetrics();
        setMetrics(response);
        setIsLoading(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics');
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <h2>Loading Dashboard...</h2>
          <p>Fetching your recruitment metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-section">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button 
            className="retry-button" 
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Recruitment Dashboard</h1>
        <p>Track your recruitment performance at a glance</p>
      </div>

      <div className="dashboard-grid">
        {/* Jobs Card */}
        <div className="dashboard-card active-jobs">
          <div className="card-icon">
            <i className="fas fa-briefcase"></i>
          </div>
          <div className="card-content">
            <h3>Active Jobs</h3>
            <div className="metric-value">{metrics.totalJobs}</div>
            <p>Total job postings currently active</p>
          </div>
        </div>

        {/* Candidates Card */}
        <div className="dashboard-card unique-candidates">
          <div className="card-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="card-content">
            <h3>Unique Candidates</h3>
            <div className="metric-value">{metrics.totalCandidates}</div>
            <p>Total unique candidates who have applied</p>
          </div>
        </div>

        {/* Applications Card */}
        <div className="dashboard-card applications">
          <div className="card-icon">
            <i className="fas fa-chart-bar"></i>
          </div>
          <div className="card-content">
            <h3>Average Applications per Job</h3>
            <div className="metric-value">{metrics.candidatesPerJob}</div>
            <p>Average number of applications per job posting</p>
          </div>
        </div>

        {/* Match Score Card */}
        <div className="dashboard-card match-score">
          <div className="card-icon">
            <i className="fas fa-percentage"></i>
          </div>
          <div className="card-content">
            <h3>Average Match Score</h3>
            <div className="metric-value">{metrics.averageMatchScore.toFixed(1)}%</div>
            <p>Average match score of all applications</p>
          </div>
        </div>
      </div>

      {/* Recent Applications Section */}
      {metrics.recentApplications.length > 0 && (
        <div className="section">
          <h2>Recent Applications</h2>
          <div className="recent-applications">
            {metrics.recentApplications.map((app) => (
              <div key={app._id} className="application-card">
                <div className="application-info">
                  <div className="candidate-info">
                    <h3>{app.candidate.name}</h3>
                    <p>Applied for {app.job.title}</p>
                  </div>
                  <div className="application-meta">
                    <span className="date">{new Date(app.createdAt).toLocaleDateString()}</span>
                    <span className="match-score">Match: {app.matchScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruiterDashboard;
