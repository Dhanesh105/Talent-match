import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jobService } from '../../services/api';
import { Job } from '../../types';
import './JobList.css';

// Define an error type for API errors
interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getAllJobs();
        console.log("Jobs data received:", data);
        
        // Handle different response formats
        if (data.jobs) {
          setJobs(data.jobs);
        } else if (Array.isArray(data)) {
          setJobs(data);
        } else {
          console.error("Unexpected jobs data format:", data);
          setError("Unexpected data format received from server");
        }
        
        setIsLoading(false);
      } catch (err: unknown) {
        console.error("Error fetching jobs:", err);
        // Type guard to check if err is an ApiError
        const apiError = err as ApiError;
        setError(apiError.response?.data?.message || apiError.message || 'Failed to fetch jobs');
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-message">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-box">
          <p className="error-title">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Safely check if jobs is defined before checking length
  if (!jobs || jobs.length === 0) {
    return (
      <div className="empty-container">
        <div>
          <h2 className="empty-title">No jobs found</h2>
          <p className="empty-message">There are currently no job openings available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-container">
      <h1 className="page-title">Available Job Opportunities</h1>
      
      <div className="job-grid">
        {jobs.map((job) => (
          <div key={job._id} className="job-card">
            <h2 className="job-title">{job.title}</h2>
            <p className="job-company">{job.companyName}</p>
            <p className="job-location">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {job.location}
            </p>
            
            <div className="skills-section">
              <h3 className="skills-title">Required Skills:</h3>
              <div className="skills-container">
                {job.requiredSkills && job.requiredSkills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            <Link to={`/jobs/${job._id}`} className="job-link">
              View Details
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobList;
