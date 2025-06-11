import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jobService, jobApplicationService } from '../../services/api';
import { Job } from '../../types';
import { useAuth } from '../../App';
import './JobDetail.css';
import JobApplicationForm from './JobApplicationForm';

// Define an error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const { authState } = useAuth();
  const { user } = authState;

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const data = await jobService.getJobById(id);
        setJob(data.job);
        setIsLoading(false);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch job details');
        setIsLoading(false);
      }
    };

    const checkApplicationStatus = async () => {
      if (!id || !user || user.role !== 'candidate') return;

      try {
        setCheckingApplication(true);
        // Get user's applications to check if they've applied for this job
        const response = await jobApplicationService.getMyApplications();
        const applications = response.data || [];
        const hasAppliedToThisJob = applications.some((app: any) => app.job._id === id);
        setHasApplied(hasAppliedToThisJob);
        setCheckingApplication(false);
      } catch (err) {
        console.error('Error checking application status:', err);
        setCheckingApplication(false);
      }
    };

    fetchJob();
    checkApplicationStatus();
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-message">Loading job details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-detail-container">
        <div className="error-box">
          <p className="error-title">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="job-detail-container">
        <div className="empty-container">
          <div>
            <h2 className="empty-title">Job not found</h2>
            <p className="empty-message">The job posting you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleApplyClick = () => {
    setShowApplicationForm(true);
  };

  const handleCloseForm = () => {
    setShowApplicationForm(false);
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    setShowApplicationForm(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="job-detail-container">
      <div className="job-detail-card">
        <div className="job-detail-header">
          <div>
            <h1 className="job-detail-title">{job.title}</h1>
            <p className="job-detail-company">{job.companyName}</p>
            <p className="job-detail-location">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {job.location}
            </p>
            <p className="job-detail-date">Posted on {formatDate(job.createdAt)}</p>
          </div>
          
          {user && user.role === 'candidate' && (
            <div>
              {checkingApplication ? (
                <button className="apply-button" disabled>
                  Checking...
                </button>
              ) : hasApplied ? (
                <button className="apply-button applied" disabled>
                  ✓ Applied
                </button>
              ) : (
                <button
                  onClick={handleApplyClick}
                  className="apply-button"
                >
                  Apply Now
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="section">
          <h2 className="section-title">Job Description</h2>
          <div className="job-description">
            {job.description}
          </div>
        </div>
        
        <div className="section">
          <h2 className="section-title">Required Skills</h2>
          <div className="skills-container">
            {job.requiredSkills.map((skill, index) => (
              <span 
                key={index} 
                className="skill-tag"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showApplicationForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Apply for {job.title}</h2>
              <button 
                onClick={handleCloseForm}
                className="close-button"
              >
                ✕
              </button>
            </div>
            
            <JobApplicationForm jobId={job._id} onSuccess={handleApplicationSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;
