import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { azureService } from '../services/azure';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole, onlyAdmin, onlyHR, onlyApplicant } from '../middleware/roleMiddleware';
import { AuthRequest, ApiResponse } from '../types';

const router = Router();

router.post(
  '/login',
  authMiddleware,  
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const userEmail = (req as any).user?.email;
      const result = await supabaseService.select('users', {
        user_id: userId
      });

      if (!result.success || !result.data || result.data.length === 0) {
        console.warn('[LOGIN] User not found in database:', userId);
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      const user = result.data[0];
      console.log(`[LOGIN] ${user.name} (${user.role}) logged in successfully`);

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role,
          created_at: user.created_at
        }
      });
    } catch (error) {
      console.error('[LOGIN] Error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Login verification failed'
      });
    }
  }
);


router.get(
  '/jobs',
  authMiddleware,      
  async (req: AuthRequest, res: Response) => {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Jobs fetched (placeholder)',
        data: []
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: String(error)
      });
    }
  }
);

router.post(
  '/jobs',
  authMiddleware,           
  requireRole(['admin', 'hr']),  
  async (req: AuthRequest, res: Response) => {
    try {
      res.status(201).json({
        status: 'success',
        message: 'Job created (placeholder)',
        data: { job_id: 'new-job-123' }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: String(error)
      });
    }
  }
);

router.delete(
  '/jobs/:id',
  authMiddleware,       
  onlyAdmin,         
  async (req: AuthRequest, res: Response) => {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Job deleted (placeholder)'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: String(error)
      });
    }
  }
);

router.get(
  '/me',
  authMiddleware,    
  async (req: AuthRequest, res: Response) => {
    try {
      res.status(200).json({
        status: 'success',
        message: 'Current user profile (placeholder)',
        data: {
          id: req.user?.id,
          email: req.user?.email,
          role: req.user?.role
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: String(error)
      });
    }
  }
);

router.post(
  '/applications',
  authMiddleware,        
  onlyApplicant,    
  async (req: AuthRequest, res: Response) => {
    try {
      res.status(201).json({
        status: 'success',
        message: 'Application submitted (placeholder)',
        data: { application_id: 'app-123' }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: String(error)
      });
    }
  }
);

export default router;
