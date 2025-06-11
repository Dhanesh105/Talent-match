import axios from 'axios';

// Create an axios instance with base URL and default headers
const baseURL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://tm-backend-pi.vercel.app/api'
    : 'http://localhost:5000/api');

// Only log in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', baseURL);
  console.log('Environment:', import.meta.env.MODE);
  console.log('App Name:', import.meta.env.VITE_APP_NAME);
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only log in development
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('API Response:', response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  register: async (userData: { name: string; email: string; password: string; role: string }) => {
    const response = await api.post('/users/register', userData);
    return response.data;
  },
  login: async (userData: { email: string; password: string }) => {
    const response = await api.post('/users/login', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
  },
  getUserProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
};

// Job services
export const jobService = {
  createJob: async (jobData: { 
    title: string; 
    description: string; 
    requiredSkills: string[]; 
    location: string;
    companyName: string;
  }) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },
  getAllJobs: async () => {
    const response = await api.get('/jobs');
    return response.data;
  },
  getJobById: async (id: string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  updateJob: async (id: string, jobData: { 
    title?: string; 
    description?: string; 
    requiredSkills?: string[]; 
    location?: string;
    companyName?: string;
    isActive?: boolean;
  }) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    return response.data;
  },
  deleteJob: async (id: string) => {
    const response = await api.delete(`/jobs/${id}`);
    return response.data;
  },
};

// Job Application services
export const jobApplicationService = {
  applyForJob: async (jobId: string, applicationData: FormData) => {
    const response = await api.post(
      `/jobs/${jobId}/apply`, 
      applicationData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    console.log("response.data", response.data);
    return response.data;
  },
  getJobApplications: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data;
  },
  getRecruiterApplications: async () => {
    const response = await api.get('/applications/recruiter');
    return response.data;
  },
  getMyApplications: async () => {
    const response = await api.get('/applications/me');
    return response.data;
  },
  getTopCandidatesForJob: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}/top-candidates`);
    return response.data;
  },
  updateApplicationStatus: async (applicationId: string, status: string, feedback?: string) => {
    const response = await api.patch(`/applications/${applicationId}/status`, { status, feedback });
    return response.data;
  },
};

// Dashboard Service
export const dashboardService = {
  getDashboardMetrics: async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },
};

export default api;
