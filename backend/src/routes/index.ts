import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { azureService } from '../services/azure';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole, onlyAdmin, onlyHR, onlyHROrAdmin } from '../middleware/roleMiddleware';
import { AuthRequest, ApiResponse } from '../types';
import cvRouter from './cv';

const router = Router();
router.use('/cv', cvRouter);

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

// OAuth Callback Handler for Google Login
router.post(
  '/auth/oauth-callback',
  authMiddleware,  
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const userEmail = (req as any).user?.email;
      const { email, name, provider, provider_id } = req.body;

      console.log(`[OAUTH CALLBACK] Processing OAuth for ${userEmail} via ${provider}`);

      // Validate email domain
      if (!userEmail?.endsWith('@mail.ugm.ac.id')) {
        console.warn('[OAUTH CALLBACK] Invalid email domain:', userEmail);
        return res.status(403).json({
          status: 'error',
          message: `Email ${userEmail} tidak diizinkan. Hanya email @mail.ugm.ac.id yang dapat login.`
        });
      }

      // Check if user exists by email (simple approach)
      const userResult = await supabaseService.select('users', {
        email: userEmail
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        console.warn('[OAUTH CALLBACK] User not found in database:', userEmail);
        return res.status(404).json({
          status: 'error',
          message: `User dengan email ${userEmail} belum terdaftar. Silahkan hubungi admin untuk didaftarkan.`
        });
      }

      const userData = userResult.data[0];
      console.log(`[OAUTH CALLBACK] ✅ User found: ${userData.name} (${userData.role})`);

      // CRITICAL: Validate role is only 'hr' or 'admin'
      const userRole = userData.role?.toLowerCase();
      if (!['hr', 'admin'].includes(userRole)) {
        console.warn('[OAUTH CALLBACK] ❌ User has invalid role:', userData.role);
        return res.status(403).json({
          status: 'error',
          message: `User dengan role '${userData.role}' tidak diizinkan login.`
        });
      }

      res.status(200).json({
        status: 'success',
        message: 'OAuth login successful',
        data: {
          user_id: userData.user_id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          created_at: userData.created_at
        }
      });
    } catch (error: any) {
      console.error('[OAUTH CALLBACK] Error:', error.message);
      res.status(500).json({
        status: 'error',
        message: error.message || 'OAuth callback failed'
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
  onlyHROrAdmin,    
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
