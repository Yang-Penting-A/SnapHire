import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { azureService } from '../services/azure';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireRole, onlyAdmin, onlyHR, onlyHROrAdmin } from '../middleware/roleMiddleware';
import { AuthRequest, ApiResponse } from '../types';
import cvRouter from './cv';
import emailRouter from './email';
import atsAutomationRouter from './atsAutomation';
import interviewsRouter from './interviews';

const router = Router();

// Protected routes requiring authentication
router.use('/cv', authMiddleware, cvRouter);
router.use('/email', authMiddleware, emailRouter);

// ATS automation trigger - no auth required (triggered after status update)
router.use('/applications', atsAutomationRouter);

// Public interview confirmation endpoint (token confirmation)
router.use('/interviews', interviewsRouter);

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
      console.log(`[LOGIN] User: ${user.name} (${user.role})`);

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

      // Check if user exists by email (simple approach)
      const userResult = await supabaseService.select('users', {
        email: userEmail
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: `User dengan email ${userEmail} belum terdaftar. Silahkan hubungi admin untuk didaftarkan.`
        });
      }

      const userData = userResult.data[0];
      console.log(`[AUTH] OAuth: ${userData.name} (${userData.role})`);

      // CRITICAL: Validate role is only 'hr' or 'admin'
      const userRole = userData.role?.toLowerCase();
      if (!['hr', 'admin'].includes(userRole)) {
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

// Reset Password - No auth required since user is not logged in
router.post(
  '/auth/reset-password',
  async (req: Request, res: Response) => {
    try {
      const { email, newPassword } = req.body;

      // Validation
      if (!email || !newPassword) {
        return res.status(400).json({
          status: 'error',
          message: 'Email dan password baru wajib diisi'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          status: 'error',
          message: 'Password minimal 8 karakter'
        });
      }

      // Check if user exists in database
      const userResult = await supabaseService.select('users', {
        email: email.toLowerCase()
      });

      if (!userResult.success || !userResult.data || userResult.data.length === 0) {
        console.warn('[RESET PASSWORD] User not found:', email);
        return res.status(404).json({
          status: 'error',
          message: 'Email tidak ditemukan dalam sistem'
        });
      }

      const user = userResult.data[0];
      const userId = user.user_id;

      // Use Supabase admin API to update password
      const { supabase } = require('../services/supabase');
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (updateError) {
        console.error('[AUTH] Password update error: ' + updateError.message);
        return res.status(500).json({
          status: 'error',
          message: 'Gagal memperbarui password. Silahkan coba lagi.'
        });
      }

      console.log(`[AUTH] Password reset: ${email}`);
      res.status(200).json({
        status: 'success',
        message: 'Password berhasil diperbarui'
      });
    } catch (error: any) {
      console.error('[AUTH] Error: ' + error.message);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Terjadi kesalahan saat mereset password'
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
