import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../../services/api';
import { Job } from '../../types';
import { ApiError } from '../../types/error';
import { useAuth } from '../../context/AuthContext';
import './RecruiterStyles.css';

const RecruiterJobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authState } = useAuth();
  const { user } = authState;
  
  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await jobService.getAllJobs();
      
      // Handle the jobs response format
      const allJobs = Array.isArray(response) 
        ? response 
        : response.jobs || [];
      
      // Sort jobs by date (newest first)
      // const sortedJobs = [...allJobs].sort((a: Job, b: Job) => {
      //   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      // });
      
      // // Filter jobs to only show those belonging to the current recruiter
      // const filteredJobs = user 
      //   ? sortedJobs.filter((job: Job) => 
      //       typeof job.recruiter === 'string' 
      //         ? job.recruiter === user._id 
      //         : job.recruiter._id === user._id)
      //   : sortedJobs;
      
      setJobs(allJobs);
      setIsLoading(false);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message || 'Failed to fetch jobs');
      setIsLoading(false);
    }
  }, [user]);
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  const handleDeleteJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await jobService.deleteJob(id);
      
      // Remove the deleted job from state
      setJobs(prevJobs => prevJobs.filter(job => job._id !== id));
      setIsLoading(false);
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message || 'Failed to delete job');
      setIsLoading(false);
    }
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
  
  if (isLoading && jobs.length === 0) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading job postings...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Manage Job Postings</h1>
        <p>Create, edit, and track your job listings</p>
      </div>
      
      <div className="action-bar">
        {/* <div className="job-stats">
          <div className="stat-item">
            <span className="stat-value">{jobs.length}</span>
            <span className="stat-label">Active Jobs</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{jobs.reduce((count, job) => {
              // Safely access applicationCount with fallback to 0
              const appCount = (job as any).applicationCount || 0;
              return count + appCount;
            }, 0)}</span>
            <span className="stat-label">Total Applications</span>
          </div>
        </div> */}
        <Link to="/recruiter/jobs/new" className="btn btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Post New Job
        </Link>
      </div>
      
      {error && (
        <div className="error-container">
          <p>{error}</p>
        </div>
      )}
      
      {jobs.length === 0 ? (
        <div className="empty-container">
          {/* <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            <line x1="12" y1="10" x2="12" y2="16"></line>
            <line x1="9" y1="13" x2="15" y2="13"></line>
          </svg> */}
          {/* <h3>No Jobs Posted Yet</h3> */}
          <p>You haven't posted any job listings yet. Get started by creating your first job posting.</p>
          {/* <Link to="/recruiter/jobs/new" className="btn btn-primary">
            Post Your First Job
          </Link> */}
        </div>
      ) : (
        <div className="job-management-container">
          <div className="section-header">
            <h2 className="section-title">Your Active Listings</h2>
            <div className="section-actions">
              <button onClick={fetchJobs} className="btn btn-secondary btn-small">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="card-grid">
            {jobs.map(job => (
              <div key={job._id} className="job-card">
                <div className="job-card-header">
                  <h3 className="job-card-title">{job.title}</h3>
                  <div className="job-card-company">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                    </svg>
                    {job.companyName}
                  </div>
                  <div className="job-card-location">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {job.location}
                  </div>
                </div>
                <div className="job-card-body">
                  <p className="job-card-description">{job.description}</p>
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="skills-container">
                      {job.requiredSkills.map((skill: string, index: number) => (
                        <span key={index} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="job-card-footer">
                  <div className="job-date">Posted {formatDate(job.createdAt)}</div>
                  <div className="job-actions">
                    <Link to={`/recruiter/jobs/${job._id}/candidates`} className="action-link view-action">
                      View Candidates
                    </Link>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="action-link "
                    >
                      Delete Job
                    </button>
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

export default RecruiterJobList;
