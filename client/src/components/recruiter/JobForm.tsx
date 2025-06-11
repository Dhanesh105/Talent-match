import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jobService } from '../../services/api';
import { Job } from '../../types';
import { ApiError } from '../../types/error';
import './RecruiterStyles.css';

interface JobFormData {
  title: string;
  companyName: string;
  location: string;
  description: string;
  requiredSkills: string;
  type: string;
  isActive: boolean;
}

const JobForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    companyName: '',
    location: '',
    description: '',
    requiredSkills: '',
    type: 'Full-time',
    isActive: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      const fetchJob = async () => {
        try {
          setIsFetching(true);
          const data = await jobService.getJobById(id);
          const job: Job = data.job;
          
          setFormData({
            title: job.title,
            companyName: job.companyName,
            location: job.location,
            description: job.description,
            requiredSkills: job.requiredSkills.join(', '),
            type: job.type || 'Full-time',
            isActive: job.isActive !== undefined ? job.isActive : true
          });
          
          setIsFetching(false);
        } catch (err: unknown) {
          const error = err as ApiError;
          setError(error.message || 'Failed to fetch job details');
          setIsFetching(false);
        }
      };

      fetchJob();
    }
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxInput = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checkboxInput.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      const requiredSkillsArray = formData.requiredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill !== '');
      
      const jobData = {
        title: formData.title,
        companyName: formData.companyName,
        location: formData.location,
        description: formData.description,
        requiredSkills: requiredSkillsArray,
        type: formData.type,
        isActive: formData.isActive
      };
      
      if (isEditMode) {
        await jobService.updateJob(id, jobData);
      } else {
        await jobService.createJob(jobData);
      }
      
      setIsLoading(false);
      navigate('/recruiter/jobs');
    } catch (err: unknown) {
      const error = err as ApiError;
      setError(error.message || 'Failed to save job');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-message">Loading job details...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{isEditMode ? 'Edit Job' : 'Create New Job'}</h1>
        <p>{isEditMode ? 'Update your job posting information' : 'Post a new job opportunity'}</p>
      </div>
      
      <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && (
          <div className="error-container">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label htmlFor="title">Job Title</label>
            <input
              type="text"
              id="title"
              name="title"
              className="form-control"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="companyName">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                className="form-control"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g. Tech Innovators Inc."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. San Francisco, CA"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="type">Job Type</label>
            <select
              id="type"
              name="type"
              className="form-control"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Job Description</label>
            <textarea
              id="description"
              name="description"
              className="form-control"
              value={formData.description}
              onChange={handleChange}
              rows={8}
              placeholder="Describe the responsibilities, qualifications, and benefits of the job..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="requiredSkills">Required Skills (comma-separated)</label>
            <input
              type="text"
              id="requiredSkills"
              name="requiredSkills"
              className="form-control"
              value={formData.requiredSkills}
              onChange={handleChange}
              placeholder="e.g. JavaScript, React, Node.js"
              required
            />
          </div>
          
          <div className="form-group checkbox-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <span className="checkbox-label">Job is active and visible to candidates</span>
            </label>
          </div>
          
          <div className="form-actions">
            <Link to="/recruiter/jobs" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditMode ? 'Update Job' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
