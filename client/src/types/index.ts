// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

// Job types
export interface Job {
  _id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  requirements: string;
  responsibilities: string;
  salary?: string;
  type?: string; // full-time, part-time, etc.
  requiredSkills: string[];
  recruiter: string | User;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Job Application types
export interface JobApplication {
  _id: string;
  job: string | Job;
  candidate: string | User;
  resumeUrl: string;
  coverLetter?: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'hired' | 'rejected';
  matchScore?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  totalJobs: number;
  totalCandidates: number;
  candidatesPerJob: number;
  averageMatchScore: number;
  recentApplications: {
    _id: string;
    candidate: {
      _id: string;
      name: string;
    };
    job: {
      _id: string;
      title: string;
    };
    matchScore: number;
    createdAt: string;
  }[];
}
