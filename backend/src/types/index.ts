import { Request } from 'express';

export interface AuthUser {
  id: string;           
  email: string;        
  createdAt?: string;   
  role?: string;        
  name?: string;        
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface User {
  user_id: string;        
  name: string;         
  email: string;         
  role: 'applicant' | 'hr' | 'admin';  
  is_active: boolean;     
  created_at: string;    
  password?: string;      
}

export interface ActivityLog {
  log_id: string;         
  user_id: string;        
  activity: string;       
  timestamp: string;      
  ip_address?: string;    
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export type UserRole = 'admin' | 'hr' | 'applicant';

export interface Job {
  job_id: string;
  title: string;
  description: string;
  requirement: string;
  status_job: string;
  created_at: string;
  department: string;
  created_by: string;
  location: string;
  employment_type: string;
  salary_min: number;
  salary_max: number;
  work_type: 'On-site' | 'Remote' | 'Hybrid';
  due_date: string;
  required_skills: string[];
}

export interface Application {
  application_id: string;
  candidate_id: string;
  job_id: string;
  score: number;
  ai_rank: number;
  cv_path: string;
  status_application: string;
  extracted_skill: string[];
  created_at: string;
}

export interface Candidate {
  candidate_id: string;
  user_id: string;
  phone_number: string;
  portfolio_url: string;
  linkedin_url: string;
}
