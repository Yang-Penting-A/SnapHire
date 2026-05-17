import { Router, Request, Response } from 'express';
import ATSEmailService from '../services/email/sendEmail';
import { generateInterviewInvitationHTML } from '../services/email/templates';
import { supabaseService } from '../services/supabase';
import { onlyHR, onlyHROrAdmin } from '../middleware/roleMiddleware';
import { AuthRequest } from '../types';

const router = Router();

// Send interview invitation
router.post(
  '/send-interview-invitation',
  onlyHROrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { candidateId, candidateEmail, candidateName, jobTitle, interviewDate, interviewLocation } = req.body;

      // Validate input
      if (!candidateEmail || !candidateName || !jobTitle || !interviewDate || !interviewLocation) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: candidateEmail, candidateName, jobTitle, interviewDate, interviewLocation'
        });
      }

      // Generate confirmation token
      const confirmationToken = `interview_${candidateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Save token to database
      const tokenResult = await supabaseService.insert('confirmation_tokens', {
        candidate_id: candidateId,
        token: confirmationToken,
        token_type: 'interview_confirmation',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      if (!tokenResult.success) {
        console.error('[EMAIL] Failed to save confirmation token:', tokenResult.message);
        return res.status(500).json({
          success: false,
          error: 'Failed to save confirmation token'
        });
      }

      // Send email
      const emailService = new ATSEmailService();
      const result = await emailService.sendInterviewInvitation(
        candidateEmail,
        candidateName,
        jobTitle,
        interviewDate,
        interviewLocation,
        confirmationToken
      );

      if (!result.success) {
        console.error('[EMAIL] Failed to send interview invitation:', result.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send interview invitation',
          details: result.error
        });
      }

      // Update candidate status
      const statusResult = await supabaseService.update('candidates',
        { status: 'interview_invited', updated_at: new Date() },
        'candidate_id',
        candidateId
      );

      if (!statusResult.success) {
        console.warn('[EMAIL] Failed to update candidate status:', statusResult.message);
      }

      res.json({
        success: true,
        message: 'Interview invitation sent successfully',
        messageId: result.messageId
      });
    } catch (error) {
      console.error('[EMAIL] Exception in send-interview-invitation:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Send technical test notification
router.post(
  '/send-technical-test',
  onlyHROrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { candidateId, candidateEmail, candidateName, jobTitle, testLink, deadline } = req.body;

      if (!candidateEmail || !candidateName || !jobTitle || !testLink || !deadline) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const emailService = new ATSEmailService();
      const result = await emailService.sendTechnicalTestNotification(
        candidateEmail,
        candidateName,
        jobTitle,
        testLink,
        deadline
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send technical test notification'
        });
      }

      // Update candidate status
      await supabaseService.update('candidates',
        { status: 'test_sent', updated_at: new Date() },
        'candidate_id',
        candidateId
      );

      res.json({
        success: true,
        message: 'Technical test notification sent',
        messageId: result.messageId
      });
    } catch (error) {
      console.error('[EMAIL] Exception in send-technical-test:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Send hired notification
router.post(
  '/send-hired-notification',
  onlyHROrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { candidateId, candidateEmail, candidateName, jobTitle } = req.body;

      if (!candidateEmail || !candidateName || !jobTitle) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: candidateEmail, candidateName, jobTitle'
        });
      }

      const emailService = new ATSEmailService();
      const result = await emailService.sendHiredNotification(candidateEmail, candidateName, jobTitle);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send hired notification'
        });
      }

      // Update candidate status
      await supabaseService.update('candidates',
        { status: 'hired', updated_at: new Date() },
        'candidate_id',
        candidateId
      );

      res.json({
        success: true,
        message: 'Hired notification sent',
        messageId: result.messageId
      });
    } catch (error) {
      console.error('[EMAIL] Exception in send-hired-notification:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Send rejection notification
router.post(
  '/send-rejection',
  onlyHROrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { candidateId, candidateEmail, candidateName, jobTitle } = req.body;

      if (!candidateEmail || !candidateName || !jobTitle) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      const emailService = new ATSEmailService();
      const result = await emailService.sendRejectionNotification(candidateEmail, candidateName, jobTitle);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to send rejection notification'
        });
      }

      // Update candidate status
      await supabaseService.update('candidates',
        { status: 'rejected', updated_at: new Date() },
        'candidate_id',
        candidateId
      );

      res.json({
        success: true,
        message: 'Rejection notification sent',
        messageId: result.messageId
      });
    } catch (error) {
      console.error('[EMAIL] Exception in send-rejection:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Confirm interview
router.post(
  '/confirm-interview',
  async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Missing confirmation token'
        });
      }

      // Get token from database
      const tokenResult = await supabaseService.select('confirmation_tokens', { token });

      if (!tokenResult.success || !tokenResult.data || tokenResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Invalid or expired confirmation token'
        });
      }

      const confirmationToken = tokenResult.data[0];

      // Check if token is expired
      if (confirmationToken.expires_at && new Date(confirmationToken.expires_at) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Confirmation token has expired'
        });
      }

      // Check if already used
      if (confirmationToken.used_at) {
        return res.status(400).json({
          success: false,
          error: 'Confirmation token already used'
        });
      }

      // Mark token as used
      await supabaseService.update('confirmation_tokens',
        { used_at: new Date() },
        'token',
        token
      );

      // Update candidate confirmation status
      await supabaseService.update('candidates',
        { interview_confirmed_at: new Date() },
        'candidate_id',
        confirmationToken.candidate_id
      );

      res.json({
        success: true,
        message: 'Interview confirmation saved successfully'
      });
    } catch (error) {
      console.error('[EMAIL] Exception in confirm-interview:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

export default router;
