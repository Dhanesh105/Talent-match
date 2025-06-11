import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Use absolute path to project root
const projectRoot = path.resolve(__dirname, '../../../');
const uploadDir = path.join(projectRoot, 'uploads');
const resumeDir = path.join(uploadDir, 'resumes');

console.log('Upload directory path:', uploadDir);
console.log('Resume directory path:', resumeDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Created upload directory:', uploadDir);
}

if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir);
  console.log('Created resume directory:', resumeDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, resumeDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filter files to only allow PDFs and DOCXs
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedFileTypes = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and DOCX files are allowed.'));
  }
};

// Create and export the multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});
