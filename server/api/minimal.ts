import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['recruiter', 'candidate'], required: true },
  createdAt: { type: Date, default: Date.now }
});

// Job Schema
const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  location: { type: String, required: true },
  companyName: { type: String, required: true },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Job Application Schema
const jobApplicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resumeUrl: { type: String },
  coverLetter: { type: String },
  status: { type: String, enum: ['pending', 'reviewed', 'accepted', 'rejected'], default: 'pending' },
  feedback: { type: String },
  aiScore: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
const JobApplication = mongoose.models.JobApplication || mongoose.model('JobApplication', jobApplicationSchema);

// Database connection function
async function connectDB() {
  try {
    if (mongoose.connection.readyState === 0) {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      await mongoose.connect(mongoUri);
      console.log('MongoDB Connected');
    }
    return true;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    return false;
  }
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://talent-match-eosin.vercel.app',
        'https://tm-backend-pi.vercel.app'
      ]
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Root route
app.get('/', (_req: Request, res: Response) => {
  try {
    res.json({
      message: 'Welcome to the AI-Powered Recruitment Tool API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      mongodb_uri_set: !!process.env.MONGODB_URI,
      jwt_secret_set: !!process.env.JWT_SECRET,
      status: 'Working without database'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Root route failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Basic API info route
app.get('/api', (_req: Request, res: Response) => {
  try {
    res.json({
      message: 'Welcome to the AI-Powered Recruitment Tool API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      status: 'API is working'
    });
  } catch (error) {
    res.status(500).json({
      error: 'API route failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  try {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      env: {
        node_env: process.env.NODE_ENV,
        mongodb_uri_set: !!process.env.MONGODB_URI,
        jwt_secret_set: !!process.env.JWT_SECRET
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Database test route
app.get('/api/db-test', async (_req: Request, res: Response) => {
  try {
    const connected = await connectDB();
    res.json({
      message: 'Database test completed',
      database_connected: connected,
      connection_state: mongoose.connection.readyState,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Database test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// User registration endpoint
app.post('/api/users/register', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({
        message: 'Database connection failed'
      });
    }

    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: 'Please provide all required fields: name, email, password, role'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error during registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user profile endpoint
app.get('/api/users/profile', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({
        message: 'Database connection failed'
      });
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;

    // Find user by ID
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Profile error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: 'Invalid token'
      });
    }
    res.status(500).json({
      message: 'Server error getting profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// User login endpoint
app.post('/api/users/login', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({
        message: 'Database connection failed'
      });
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error during login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============= JOB ENDPOINTS =============

// Get all jobs
app.get('/api/jobs', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const jobs = await Job.find({ isActive: true })
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      message: 'Server error getting jobs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get job by ID
app.get('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    const job = await Job.findById(req.params.id).populate('recruiterId', 'name email');
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      message: 'Server error getting job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create job (recruiter only)
app.post('/api/jobs', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const { title, description, requiredSkills, location, companyName } = req.body;

    if (!title || !description || !location || !companyName) {
      return res.status(400).json({
        message: 'Please provide all required fields: title, description, location, companyName'
      });
    }

    const job = new Job({
      title,
      description,
      requiredSkills: requiredSkills || [],
      location,
      companyName,
      recruiterId: user._id
    });

    await job.save();
    await job.populate('recruiterId', 'name email');

    res.status(201).json({ job, message: 'Job created successfully' });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      message: 'Server error creating job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update job
app.put('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update your own jobs.' });
    }

    const updateData = req.body;
    const updatedJob = await Job.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('recruiterId', 'name email');

    res.json({ job: updatedJob, message: 'Job updated successfully' });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      message: 'Server error updating job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete job
app.delete('/api/jobs/:id', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own jobs.' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      message: 'Server error deleting job',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============= JOB APPLICATION ENDPOINTS =============

// Apply for job
app.post('/api/jobs/:jobId/apply', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobId: req.params.jobId,
      candidateId: user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    const application = new JobApplication({
      jobId: req.params.jobId,
      candidateId: user._id,
      coverLetter: req.body.coverLetter || '',
      resumeUrl: req.body.resumeUrl || '',
      aiScore: Math.floor(Math.random() * 100) // Placeholder AI score
    });

    await application.save();
    await application.populate([
      { path: 'jobId', select: 'title companyName' },
      { path: 'candidateId', select: 'name email' }
    ]);

    res.status(201).json({
      application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({
      message: 'Server error submitting application',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get applications for a job (recruiter only)
app.get('/api/jobs/:jobId/applications', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.recruiterId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only view applications for your own jobs.' });
    }

    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title companyName')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      message: 'Server error getting applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get top candidates for a job
app.get('/api/jobs/:jobId/top-candidates', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .populate('candidateId', 'name email')
      .sort({ aiScore: -1 })
      .limit(10);

    res.json({ candidates: applications });
  } catch (error) {
    console.error('Get top candidates error:', error);
    res.status(500).json({
      message: 'Server error getting top candidates',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recruiter's applications
app.get('/api/applications/recruiter', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    // Get all jobs by this recruiter
    const recruiterJobs = await Job.find({ recruiterId: user._id }).select('_id');
    const jobIds = recruiterJobs.map(job => job._id);

    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate('candidateId', 'name email')
      .populate('jobId', 'title companyName')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get recruiter applications error:', error);
    res.status(500).json({
      message: 'Server error getting applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get candidate's applications
app.get('/api/applications/me', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'candidate') {
      return res.status(403).json({ message: 'Access denied. Candidate role required.' });
    }

    const applications = await JobApplication.find({ candidateId: user._id })
      .populate('jobId', 'title companyName location')
      .sort({ createdAt: -1 });

    res.json({ applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      message: 'Server error getting applications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update application status
app.patch('/api/applications/:applicationId/status', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Access denied. Recruiter role required.' });
    }

    const application = await JobApplication.findById(req.params.applicationId)
      .populate('jobId');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the recruiter owns the job
    const job = application.jobId as any;
    if (job.recruiterId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. You can only update applications for your own jobs.' });
    }

    const { status, feedback } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    application.status = status;
    if (feedback) {
      application.feedback = feedback;
    }

    await application.save();
    await application.populate([
      { path: 'candidateId', select: 'name email' },
      { path: 'jobId', select: 'title companyName' }
    ]);

    res.json({
      application,
      message: 'Application status updated successfully'
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      message: 'Server error updating application status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============= DASHBOARD ENDPOINTS =============

// Get dashboard metrics
app.get('/api/dashboard/metrics', async (req: Request, res: Response) => {
  try {
    const dbConnected = await connectDB();
    if (!dbConnected) {
      return res.status(500).json({ message: 'Database connection failed' });
    }

    // Get token and verify user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let metrics = {};

    if (user.role === 'recruiter') {
      // Recruiter metrics
      const totalJobs = await Job.countDocuments({ recruiterId: user._id });
      const activeJobs = await Job.countDocuments({ recruiterId: user._id, isActive: true });

      const recruiterJobs = await Job.find({ recruiterId: user._id }).select('_id');
      const jobIds = recruiterJobs.map(job => job._id);

      const totalApplications = await JobApplication.countDocuments({ jobId: { $in: jobIds } });
      const pendingApplications = await JobApplication.countDocuments({
        jobId: { $in: jobIds },
        status: 'pending'
      });

      metrics = {
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        role: 'recruiter'
      };
    } else {
      // Candidate metrics
      const totalApplications = await JobApplication.countDocuments({ candidateId: user._id });
      const pendingApplications = await JobApplication.countDocuments({
        candidateId: user._id,
        status: 'pending'
      });
      const acceptedApplications = await JobApplication.countDocuments({
        candidateId: user._id,
        status: 'accepted'
      });
      const totalJobs = await Job.countDocuments({ isActive: true });

      metrics = {
        totalApplications,
        pendingApplications,
        acceptedApplications,
        totalJobs,
        role: 'candidate'
      };
    }

    res.json({ metrics });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      message: 'Server error getting dashboard metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default app;
