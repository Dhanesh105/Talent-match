import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApplicationService, jobService } from '../../services/api';
import { JobApplication, Job } from '../../types';
import { ApiError } from '../../types/error';
import { useAuth } from '../../context/AuthContext';
import './RecruiterStyles.css';

// Define the status type to match the backend expectations
type ApplicationStatus = 'pending' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected';

const RecruiterApplicationList: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobs] = useState<Record<string, Job>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const { user } = authState;
  
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all applications for the recruiter
        const response = await jobApplicationService.getRecruiterApplications();
        const applications = response.data || [];
        console.log("applications",response);
        // Fetch all jobs to have job details for reference
        await jobService.getAllJobs();
//         const jobsList = Array.isArray(jobsResponse) 
//           ? jobsResponse 
//           : jobsResponse.data
//  || [];

 console.log("jobsList",applications);
        
        // Convert jobs array to lookup object by ID
        // const jobsMap: Record<string, Job> = {};
        // jobsList.forEach((job: Job) => {
        //   jobsMap[job._id] = job;
        // });
        // setJobs(jobsMap);
        
        // // Sort applications by date (newest first)
        // applications.sort((a: JobApplication, b: JobApplication) => {
        //   return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        // });
        
        setApplications(applications);
        setIsLoading(false);
      } catch (err: unknown) {
        const error = err as ApiError;
        setError(error.message || 'Failed to fetch applications');
        setIsLoading(false);
      }
    };
    
    fetchApplications();
  }, [user]);
  
  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      // Update application status
      await jobApplicationService.updateApplicationStatus(applicationId, newStatus);
      
      // Update local state
      setApplications(prevApplications => 
        prevApplications.map(app => 
          app._id === applicationId 
            ? { ...app, status: newStatus as ApplicationStatus } 
            : app
        )
      );
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message || 'Failed to update application status');
    }
  };
  
  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Format date to readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading applications...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Applications</h1>
        <p>Review and manage applications for all your job postings</p>
      </div>
      
      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}
      
      {applications.length === 0 ? (
        <div className="empty-container">
          {/* <h3>No Applications Yet</h3> */}
          <p>You haven't received any applications for your job postings yet.</p>
          {/* <Link to="/recruiter/jobs" className="btn btn-primary">
            Manage Your Jobs
          </Link> */}
        </div>
      ) : (
        <>
          {/* Applications filter and stats */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="section-header">
              <h2 className="section-title">Applications Overview</h2>
              <span>{applications.length} Total Applications</span>
            </div>
            
            <div className="metrics-grid" style={{ marginBottom: '0' }}>
              <div className="metric-card" style={{ boxShadow: 'none', padding: '1rem' }}>
                <div className="metric-content">
                  <div className="metric-title">Pending</div>
                  <div className="metric-value">{applications.filter(app => app.status === 'pending').length}</div>
                </div>
              </div>
              
              <div className="metric-card" style={{ boxShadow: 'none', padding: '1rem' }}>
                <div className="metric-content">
                  <div className="metric-title">Reviewed</div>
                  <div className="metric-value">{applications.filter(app => app.status === 'reviewed').length}</div>
                </div>
              </div>
              
              <div className="metric-card" style={{ boxShadow: 'none', padding: '1rem' }}>
                <div className="metric-content">
                  <div className="metric-title">Shortlisted</div>
                  <div className="metric-value">{applications.filter(app => app.status === 'shortlisted').length}</div>
                </div>
              </div>
              
              <div className="metric-card" style={{ boxShadow: 'none', padding: '1rem' }}>
                <div className="metric-content">
                  <div className="metric-title">Hired</div>
                  <div className="metric-value">{applications.filter(app => app.status === 'hired').length}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Applications Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Applied On</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(application => (
                  <tr key={application._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="candidate-avatar" style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}>
                          {getInitials(
                            typeof application.candidate === 'object'
                              ? (application.candidate as any).name || 'U N'
                              : 'U N'
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>
                            {typeof application.candidate === 'object'
                              ? (application.candidate as any).name
                              : 'Unknown Candidate'}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                            {typeof application.candidate === 'object' 
                              ? application.candidate.email 
                              : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {typeof application.job === 'object' 
                        ? application.job.title 
                        : jobs[application.job]?.title || 'Unknown Job'}
                    </td>
                    <td>{formatDate(application.createdAt)}</td>
                    <td>
                      <div className="match-score-display">
                        <span className="score-value">{application.matchScore || 0}%</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${application.matchScore || 0}%`,
                              backgroundColor: (application.matchScore || 0) >= 80 ? '#28a745' : 
                                              (application.matchScore || 0) >= 60 ? '#4169e1' : '#ffc107'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        value={application.status}
                        onChange={(e) => handleStatusChange(application._id, e.target.value)}
                        className="status-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link
                          to={`/recruiter/jobs/${
                            typeof application.job === 'object' ? application.job._id : application.job
                          }/candidates`}
                          className="action-link view-action"
                        >
                          View Details
                        </Link>
                        {application.resumeUrl && (
                          <a
                            href={application.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="action-link"
                            style={{ color: 'var(--info-color)' }}
                          >
                            Resume
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default RecruiterApplicationList;
