import { Request, Response } from 'express';
import ATSEmailService from '../services/email/sendEmail';
import { supabaseService } from '../services/supabase';
import { AuthRequest } from '../core/types/authRequest';

export async function sendInterviewInvitation(req: AuthRequest, res: Response) {
  try {
    const { applicationId, candidateId, candidateEmail, candidateName, jobTitle, interviewDate, interviewLocation } = req.body;

    if (!applicationId || !candidateEmail || !candidateName || !jobTitle || !interviewDate || !interviewLocation) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: applicationId, candidateEmail, candidateName, jobTitle, interviewDate, interviewLocation'
      });
    }

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
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function sendTechnicalTest(req: AuthRequest, res: Response) {
  try {
    const { candidateId, candidateEmail, candidateName, jobTitle, testLink, deadline } = req.body;

    if (!candidateEmail || !candidateName || !jobTitle || !testLink || !deadline) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
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
      return res.status(500).json({ success: false, error: 'Failed to send technical test notification' });
    }

    await supabaseService.update('candidates', { status: 'test_sent', updated_at: new Date() }, 'candidate_id', candidateId);

    res.json({ success: true, message: 'Technical test notification sent', messageId: result.messageId });
  } catch (error) {
    console.error('[EMAIL] Exception in send-technical-test:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function sendHiredNotification(req: AuthRequest, res: Response) {
  try {
    const { candidateId, candidateEmail, candidateName, jobTitle } = req.body;

    if (!candidateEmail || !candidateName || !jobTitle) {
      return res.status(400).json({ success: false, error: 'Missing required fields: candidateEmail, candidateName, jobTitle' });
    }

    const emailService = new ATSEmailService();
    const result = await emailService.sendHiredNotification(candidateEmail, candidateName, jobTitle);

    if (!result.success) {
      return res.status(500).json({ success: false, error: 'Failed to send hired notification' });
    }

    await supabaseService.update('candidates', { status: 'hired', updated_at: new Date() }, 'candidate_id', candidateId);

    res.json({ success: true, message: 'Hired notification sent', messageId: result.messageId });
  } catch (error) {
    console.error('[EMAIL] Exception in send-hired-notification:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function sendRejection(req: AuthRequest, res: Response) {
  try {
    const { candidateId, candidateEmail, candidateName, jobTitle } = req.body;

    if (!candidateEmail || !candidateName || !jobTitle) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const emailService = new ATSEmailService();
    const result = await emailService.sendRejectionNotification(candidateEmail, candidateName, jobTitle);

    if (!result.success) {
      return res.status(500).json({ success: false, error: 'Failed to send rejection notification' });
    }

    await supabaseService.update('candidates', { status: 'rejected', updated_at: new Date() }, 'candidate_id', candidateId);

    res.json({ success: true, message: 'Rejection notification sent', messageId: result.messageId });
  } catch (error) {
    console.error('[EMAIL] Exception in send-rejection:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

export async function confirmInterview(req: Request, res: Response) {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({ success: false, error: 'Missing applicationId' });
    }

    const appRes = await supabaseService.select('applications', { application_id: applicationId });

    if (!appRes.success || !appRes.data || appRes.data.length === 0) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const application = appRes.data[0];

    if (application.confirmation_status && ['CONFIRMED', 'DECLINED'].includes(application.confirmation_status.toUpperCase())) {
      return res.status(400).json({ success: false, error: 'Interview response already recorded' });
    }

    await supabaseService.update('applications', { confirmation_status: 'CONFIRMED', confirmed_at: new Date() }, 'application_id', applicationId);

    if (application.candidate_id) {
      await supabaseService.update('candidates', { interview_confirmed_at: new Date() }, 'candidate_id', application.candidate_id);
    }

    res.json({ success: true, message: 'Interview confirmation saved successfully' });
  } catch (error) {
    console.error('[EMAIL] Exception in confirm-interview:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
