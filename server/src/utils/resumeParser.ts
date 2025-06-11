import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import * as docx from 'docx';
import natural from 'natural';

// NLP tools for text extraction and processing
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Lists of keywords for different sections
const EDUCATION_KEYWORDS = ['education', 'degree', 'university', 'college', 'school', 'bachelor', 'master', 'phd', 'diploma'];
const EXPERIENCE_KEYWORDS = ['experience', 'work', 'employment', 'job', 'career', 'position', 'role'];
const SKILLS_INDICATORS = ['skills', 'abilities', 'competencies', 'proficiencies', 'expertise', 'technologies'];

// Extract text from PDF files
export const extractTextFromPDF = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
};

// Extract text from DOCX files
export const extractTextFromDOCX = async (filePath: string): Promise<string> => {
  try {
    // Currently using a simplified approach as docx parsing is complex
    // In a production environment, you might want to use a more robust solution
    const buffer = fs.readFileSync(filePath);
    // This is a placeholder - actual implementation would parse the DOCX properly
    return `Extracted text from DOCX file at ${filePath}`;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error('Failed to extract text from DOCX');
  }
};

// Extract text based on file extension
export const extractText = async (filePath: string): Promise<string> => {
  const extension = path.extname(filePath).toLowerCase();
  
  if (extension === '.pdf') {
    return extractTextFromPDF(filePath);
  } else if (extension === '.docx') {
    return extractTextFromDOCX(filePath);
  } else {
    throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
  }
};

// Extract skills from resume text
export const extractSkills = (text: string): string[] => {
  // Convert text to lowercase for consistent matching
  const lowerText = text.toLowerCase();
  const tokens = tokenizer.tokenize(lowerText);
  
  // Common tech skills to look for (this list would be much more extensive in production)
  const commonSkills = [
    'javascript', 'typescript', 'react', 'node', 'express', 'mongodb', 'sql', 'nosql',
    'html', 'css', 'angular', 'vue', 'python', 'java', 'c++', 'c#', 'php', 'ruby',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'ci/cd',
    'agile', 'scrum', 'jira', 'figma', 'adobe', 'photoshop', 'illustrator',
    'communication', 'leadership', 'teamwork', 'problem-solving', 'analytical',
    'machine learning', 'ai', 'data science', 'data analysis', 'big data'
  ];
  
  // Find skills in the text
  const foundSkills = commonSkills.filter(skill => {
    // For multi-word skills, check if they appear as a phrase
    if (skill.includes(' ')) {
      return lowerText.includes(skill);
    }
    // For single-word skills, check if they appear as whole words
    return tokens.some(token => token.toLowerCase() === skill);
  });
  
  return Array.from(new Set(foundSkills)); // Remove duplicates
};

// Extract education information
export const extractEducation = (text: string): string[] => {
  const lines = text.split('\n');
  const educationLines: string[] = [];
  
  let inEducationSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    // Check if this line is an education section header
    if (EDUCATION_KEYWORDS.some(keyword => lowerLine.includes(keyword))) {
      inEducationSection = true;
    }
    
    // If we're in the education section and the line has content, add it
    if (inEducationSection && lowerLine.length > 5) {
      educationLines.push(line.trim());
    }
    
    // Check if we're leaving the education section
    if (inEducationSection && 
        EXPERIENCE_KEYWORDS.some(keyword => lowerLine.includes(keyword))) {
      inEducationSection = false;
    }
  }
  
  return educationLines;
};

// Extract experience information
export const extractExperience = (text: string): string[] => {
  const lines = text.split('\n');
  const experienceLines: string[] = [];
  
  let inExperienceSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase().trim();
    
    // Check if this line is an experience section header
    if (EXPERIENCE_KEYWORDS.some(keyword => lowerLine.includes(keyword))) {
      inExperienceSection = true;
    }
    
    // If we're in the experience section and the line has content, add it
    if (inExperienceSection && lowerLine.length > 5) {
      experienceLines.push(line.trim());
    }
    
    // Check if we're leaving the experience section
    if (inExperienceSection && 
        SKILLS_INDICATORS.some(keyword => lowerLine.includes(keyword))) {
      inExperienceSection = false;
    }
  }
  
  return experienceLines;
};

// Comprehensive resume parsing function
export const parseResume = async (filePath: string): Promise<{
  extractedText: string;
  skills: string[];
  education: string[];
  experience: string[];
}> => {
  try {
    const extractedText = await extractText(filePath);
    
    return {
      extractedText,
      skills: extractSkills(extractedText),
      education: extractEducation(extractedText),
      experience: extractExperience(extractedText)
    };
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error('Failed to parse resume');
  }
};
