# TalentMatch - AI-Powered Recruitment Tool

A modern, full-stack recruitment platform that uses AI to match candidates with job opportunities. Built with React, Node.js, and MongoDB.

## 🚀 Features

### For Candidates
- **Smart Job Matching**: AI-powered algorithm matches candidates with relevant job opportunities
- **Resume Upload & Parsing**: Automatic extraction of skills, education, and experience from PDF/DOCX resumes
- **Job Application Tracking**: Track application status and history
- **Personalized Job Recommendations**: Get job suggestions based on your profile and skills

### For Recruiters
- **Job Posting Management**: Create, edit, and manage job postings
- **Candidate Matching**: AI-powered candidate ranking based on job requirements
- **Application Management**: Review applications with match scores and candidate insights
- **Dashboard Analytics**: Track recruitment metrics and performance

### Core Features
- **Role-based Authentication**: Separate interfaces for candidates and recruiters
- **Real-time Updates**: Live application status updates
- **File Upload**: Secure resume upload with validation
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Natural** for text processing and AI matching

### AI/ML Features
- **Resume Parsing**: Extract structured data from PDF/DOCX files
- **Skill Matching**: Natural language processing for skill comparison
- **Candidate Scoring**: Algorithm-based matching scores

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Dhanesh105/Talent-match.git
cd Talent-match
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the server directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

### 4. Start the Application

**Start the backend server:**
```bash
cd server
npm run dev
```

**Start the frontend (in a new terminal):**
```bash
cd client
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📁 Project Structure

```
talent-match/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript type definitions
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Utility functions
│   │   └── ...
│   └── package.json
├── uploads/                # File upload directory
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/profile` - Get user profile

### Jobs
- `GET /api/jobs` - Get all jobs
- `POST /api/jobs` - Create job (recruiter only)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (recruiter only)
- `DELETE /api/jobs/:id` - Delete job (recruiter only)

### Applications
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/applications/me` - Get user's applications
- `GET /api/jobs/:id/applications` - Get job applications (recruiter only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Dhanesh** - *Initial work* - [Dhanesh105](https://github.com/Dhanesh105)

## 🙏 Acknowledgments

- Thanks to all contributors who helped build this project
- Inspired by modern recruitment platforms and AI matching algorithms
