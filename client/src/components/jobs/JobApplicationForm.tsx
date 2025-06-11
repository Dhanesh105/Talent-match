import React, { useState } from 'react';
import { jobApplicationService } from '../../services/api';
import { ApiError } from '../../types/error';

interface JobApplicationFormProps {
  jobId: string;
  onSuccess: () => void;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({ jobId, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [resume, setResume] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.includes('pdf') && !file.type.includes('word')) {
        setFileError('Please upload a PDF or Word document');
        setResume(null);
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFileError('File size should be less than 5MB');
        setResume(null);
        return;
      }
      
      setResume(file);
      setFileError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!resume) {
      console.log('Please upload your resume');
      setFileError('Please upload your resume');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Submitting application...');
      // Create FormData object for file upload
      const formDataToSubmit = new FormData();
      formDataToSubmit.append('name', formData.name);
      formDataToSubmit.append('email', formData.email);
      formDataToSubmit.append('resume', resume);
      
      // Log FormData contents (for debugging)
      console.log('FormData contents:');
      for (const pair of formDataToSubmit.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
      
      console.log('Calling API with jobId:', jobId);
      const result = await jobApplicationService.applyForJob(jobId, formDataToSubmit);
      console.log('Application submitted successfully', result);
      setIsLoading(false);
      onSuccess(); 
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Failed to submit application', error);
      setError(error.message || 'Failed to submit application');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          type="text"
          id="name"
          name="name"
          className="form-control"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email Address</label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-control"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="resume">Resume (PDF or Word)</label>
        <input
          type="file"
          id="resume"
          name="resume"
          className="form-control"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          required
        />
        {fileError && <p className="error-message">{fileError}</p>}
        <p className="text-sm text-gray-500 mt-1">Max file size: 5MB</p>
      </div>
      
      <button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Submitting...' : 'Submit Application'}
      </button>
    </form>
  );
};

export default JobApplicationForm;
