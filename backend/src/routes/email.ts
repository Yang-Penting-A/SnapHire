import { Router, Request, Response } from 'express';
import ATSEmailService from '../services/email/sendEmail';
import { generateInterviewInvitationHTML } from '../services/email/templates';
import { supabaseService } from '../services/supabase';
import { onlyHR, onlyHROrAdmin } from '../middleware/roleMiddleware';
import { AuthRequest } from '../types';

const router = Router();

// Send interview invitation (simplified - no token)
router.post(
  '/send-interview-invitation',
  onlyHROrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId, candidateId, candidateEmail, candidateName, jobTitle, interviewDate, interviewLocation } = req.body;

      // Validate input
      if (!applicationId || !candidateEmail || !candidateName || !jobTitle || !interviewDate || !interviewLocation) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: applicationId, candidateEmail, candidateName, jobTitle, interviewDate, interviewLocation'
        });
      }

      // Send email with simplified direct response link (no token)
      const emailService = new ATSEmailService();
      const result = await emailService.sendInterviewInvitation(
        candidateEmail,
        candidateName,
        jobTitle,
        interviewDate,
        interviewLocation,
        applicationId
      );

      if (!result.success) {
        console.error('[EMAIL] Failed to send interview invitation:', result.error);
        return res.status(500).json({
          success: false,
          error: 'Failed to send interview invitation',
          details: result.error
        });
      }

      // Update candidate status if needed
      if (candidateId) {
        const statusResult = await supabaseService.update('candidates',
          { status: 'interview_invited', updated_at: new Date() },
          'candidate_id',
          candidateId
        );

        if (!statusResult.success) {
          console.warn('[EMAIL] Failed to update candidate status:', statusResult.message);
        }
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

// Confirm interview (simplified - use applicationId instead of token)
router.post(
  '/confirm-interview',
  async (req: Request, res: Response) => {
    try {
      const { applicationId } = req.body;

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          error: 'Missing applicationId'
        });
      }

      // Lookup application
      const appRes = await supabaseService.select('applications', { application_id: applicationId });

      if (!appRes.success || !appRes.data || appRes.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      const application = appRes.data[0];

      // Check if already confirmed or declined
      if (application.confirmation_status && ['CONFIRMED', 'DECLINED'].includes(application.confirmation_status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Interview response already recorded'
        });
      }

      // Update applications and candidate
      await supabaseService.update('applications',
        { confirmation_status: 'CONFIRMED', confirmed_at: new Date() },
        'application_id',
        applicationId
      );

      if (application.candidate_id) {
        await supabaseService.update('candidates',
          { interview_confirmed_at: new Date() },
          'candidate_id',
          application.candidate_id
        );
      }

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
