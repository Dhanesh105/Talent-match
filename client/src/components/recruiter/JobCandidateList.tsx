import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobService, jobApplicationService } from '../../services/api';
import { Job, JobApplication, User } from '../../types';
import { ApiError } from '../../types/error';
import './RecruiterStyles.css';

// Refined Candidate interface based on JobApplication
interface Candidate {
  _id: string;
  candidateDetails: User;
  matchScore: number;
  resumeUrl: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected';
  job: string | Job;
  applicationId: string;
}

const JobCandidateList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchJobAndCandidates = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch job details
        const jobData = await jobService.getJobById(id);
        setJob(jobData.job);
        
        // Fetch top candidates for the job
        const candidatesData = await jobApplicationService.getTopCandidatesForJob(id);
        
        // Transform JobApplication objects to our internal Candidate type
        const transformedCandidates: Candidate[] = candidatesData.candidates.map((application: JobApplication) => {
          // Extract candidate details, handling both string ID and User object
          const candidateDetails = typeof application.candidate === 'string' 
            ? { _id: application.candidate, name: 'Unknown', email: '', role: '', createdAt: '', updatedAt: '' } 
            : application.candidate;
            
          return {
            _id: application._id,
            applicationId: application._id,
            candidateDetails: candidateDetails as User,
            matchScore: application.matchScore || 0,
            resumeUrl: application.resumeUrl,
            status: application.status,
            job: application.job
          };
        });
        
        setCandidates(transformedCandidates);
        setIsLoading(false);
      } catch (err: unknown) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to fetch data');
        setIsLoading(false);
      }
    };

    fetchJobAndCandidates();
  }, [id]);

  const handleStatusChange = async (applicationId: string, newStatus: 'pending' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected') => {
    try {
      // Call the API to update the application status
      await jobApplicationService.updateApplicationStatus(applicationId, newStatus);
      
      // Update the status in the local state
      setCandidates(prevCandidates => 
        prevCandidates.map(candidate => 
          candidate.applicationId === applicationId 
            ? { ...candidate, status: newStatus } 
            : candidate
        )
      );
    } catch (err: unknown) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to update candidate status');
    }
  };

  const sendFeedback = async (applicationId: string) => {
    // This is a placeholder function that will be implemented later
    setIsSubmitting(true);
    console.log(`Sending feedback for application ${applicationId}`);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Feedback feature coming soon!');
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading candidates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <p>{error}</p>
        </div>
        <Link to="/recruiter/jobs" className="btn btn-primary mt-4">
          Back to Jobs
        </Link>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="page-container">
        <div className="empty-container">
          <h3>Job not found</h3>
          <p>The job posting you're looking for doesn't exist or has been removed.</p>
          <Link to="/recruiter/jobs" className="btn btn-primary mt-4">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Candidates for: {job.title}</h1>
        <p>{job.companyName} • {job.location}</p>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/recruiter/jobs" className="btn btn-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Jobs
        </Link>
      </div>
      
      {candidates.length === 0 ? (
        <div className="empty-container">
          <h3>No candidates yet</h3>
          <p>There are no applications for this job posting yet.</p>
        </div>
      ) : (
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">{candidates.length} Candidates</h2>
            <span>Sorted by match score</span>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Match Score</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(candidate => (
                  <tr key={candidate._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="candidate-avatar">
                          {candidate.candidateDetails.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '500' }}>{candidate.candidateDetails.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{candidate.candidateDetails.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="match-score-display">
                        <span className="score-value">{candidate.matchScore}%</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill" 
                            style={{ 
                              width: `${candidate.matchScore}%`,
                              backgroundColor: candidate.matchScore >= 80 ? '#28a745' : 
                                              candidate.matchScore >= 60 ? '#4169e1' : '#ffc107'
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select 
                        value={candidate.status}
                        onChange={(e) => handleStatusChange(candidate.applicationId, e.target.value as 'pending' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected')}
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
                      {candidate.resumeUrl ? (
                        <a 
                          href={candidate.resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="action-link"
                        >
                          View Resume
                        </a>
                      ) : (
                        <span className="text-gray-400">No Resume</span>
                      )}
                    </td>
                    <td>
                      <button 
                        onClick={() => sendFeedback(candidate.applicationId)}
                        className="action-link"
                        disabled={isSubmitting}
                      >
                        Send Feedback
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCandidateList;
