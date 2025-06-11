import natural from 'natural';
import { IJob } from '../models/Job';
import { ICandidate } from '../models/Candidate';
import mongoose from 'mongoose';

// TF-IDF for term importance
const TfIdf = natural.TfIdf;

// Calculate the Jaccard similarity between two arrays
export const calculateJaccardSimilarity = (arr1: string[], arr2: string[]): number => {
  const set1 = new Set(arr1.map(item => item.toLowerCase()));
  const set2 = new Set(arr2.map(item => item.toLowerCase()));
  
  const intersection = new Set([...set1].filter(item => set2.has(item)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

// Calculate similarity based on text content using TF-IDF
export const calculateTextSimilarity = (text1: string, text2: string): number => {
  const tfidf = new TfIdf();
  
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  
  let score = 0;
  let terms = 0;
  
  // Get unique terms from the first document and calculate similarity
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text1);
  
  if (!tokens) return 0;
  
  const uniqueTerms = Array.from(new Set(tokens));
  
  for (const term of uniqueTerms) {
    // Use the correct callback type for tfidf function
    const tfidfScore = tfidf.tfidf(term, 0);
    // Handle the correct return type for tfidfs
    const termFrequencyInDoc2 = tfidf.tfidfs(term)[1];
    
    if (typeof tfidfScore === 'number' && typeof termFrequencyInDoc2 === 'number') {
      score += tfidfScore * termFrequencyInDoc2;
      terms++;
    }
  }
  
  return terms > 0 ? score / terms : 0;
};

// Calculate a match score between a candidate and a job
export const calculateMatchScore = (candidate: ICandidate, job: IJob): number => {
  // Define weights for different factors
  const weights = {
    skillsMatch: 0.6,     // 60% weight for skills matching
    textSimilarity: 0.3,  // 30% weight for overall text similarity
    education: 0.1        // 10% weight for education
  };
  
  // 1. Calculate skill match (Jaccard similarity)
  const skillScore = calculateJaccardSimilarity(candidate.skills, job.requiredSkills);
  
  // 2. Calculate text similarity between resume and job description
  const textScore = calculateTextSimilarity(candidate.extractedText, job.description);
  
  // 3. Basic education score (could be improved with more sophisticated matching)
  let educationScore = 0;
  if (candidate.education.length > 0) {
    educationScore = 0.7; // Basic score if we found education info
  }
  
  // Calculate weighted score
  const weightedScore = 
    (skillScore * weights.skillsMatch) +
    (textScore * weights.textSimilarity) +
    (educationScore * weights.education);
  
  // Convert to percentage and round to 2 decimal places
  return Math.round(weightedScore * 100);
};

// Batch process to match a candidate against multiple jobs
export const matchCandidateToJobs = (candidate: ICandidate, jobs: IJob[]): Array<{jobId: mongoose.Types.ObjectId, score: number}> => {
  return jobs.map(job => ({
    jobId: job._id as mongoose.Types.ObjectId,
    score: calculateMatchScore(candidate, job)
  }));
};

// Batch process to match a job against multiple candidates
export const matchJobToCandidates = (job: IJob, candidates: ICandidate[]): Array<{candidateId: mongoose.Types.ObjectId, score: number}> => {
  return candidates.map(candidate => ({
    candidateId: candidate._id as mongoose.Types.ObjectId,
    score: calculateMatchScore(candidate, job)
  }));
};
