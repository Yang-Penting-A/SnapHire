import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { onlyHROrAdmin } from '../middleware/roleMiddleware';
import { AuthRequest } from '../types';
import ATSEmailService from '../services/email/sendEmail';

const router = Router();

// Valid status transitions
const VALID_STATUSES = ['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'];

// Statuses that trigger ATS email notifications
const EMAIL_TRIGGER_STATUSES = {
  'Interview': 'interview_invitation',
  'Technical Test': 'technical_test_notification',
  'Hired': 'hired_notification',
  'Rejected': 'rejection_notification'
};

// Update application status with ATS automation
router.put(
  '/:applicationId/status',
  onlyHROrAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { applicationId } = req.params;
      const { newStatus, interviewDate, interviewLocation } = req.body;

      if (!newStatus) {
        return res.status(400).json({
          success: false,
          error: 'newStatus is required'
        });
      }

      if (!VALID_STATUSES.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`
        });
      }

      // Fetch application with candidate and job details
      const appResult = await supabaseService.select('applications', 
        { application_id: applicationId }
      );

      if (!appResult.success || !appResult.data || appResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Application not found'
        });
      }

      const application = appResult.data[0];

      // Fetch candidate details
      const candidateResult = await supabaseService.select('candidates',
        { candidate_id: application.candidate_id }
      );

      if (!candidateResult.success || !candidateResult.data || candidateResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Candidate not found'
        });
      }

      const candidate = candidateResult.data[0];

      // Fetch job details
      const jobResult = await supabaseService.select('jobs',
        { job_id: application.job_id }
      );

      if (!jobResult.success || !jobResult.data || jobResult.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      const job = jobResult.data[0];

      // Update application status
      const updateResult = await supabaseService.update(
        'applications',
        { status_application: newStatus, updated_at: new Date() },
        'application_id',
        applicationId
      );

      if (!updateResult.success) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update application status'
        });
      }

      // Handle ATS automation
      if (Object.keys(EMAIL_TRIGGER_STATUSES).includes(newStatus)) {
        await handleAtsAutomation(
          newStatus,
          applicationId,
          candidate,
          job,
          application,
          { interviewDate, interviewLocation }
        );
      }

      res.json({
        success: true,
        message: `Status updated to ${newStatus}`,
        data: {
          application_id: applicationId,
          status_application: newStatus
        }
      });
    } catch (error) {
      console.error('[APPLICATIONS] Exception in update status:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
);

// Handle ATS automation for specific statuses
async function handleAtsAutomation(
  status: string,
  applicationId: string,
  candidate: any,
  job: any,
  application: any,
  interviewDetails?: { interviewDate?: string; interviewLocation?: string }
) {
  try {
    const emailService = new ATSEmailService();

    switch (status) {
      case 'Interview':
        await handleInterviewAutomation(
          applicationId,
          candidate,
          job,
          emailService,
          interviewDetails
        );
        break;

      case 'Technical Test':
        await handleTechnicalTestAutomation(
          applicationId,
          candidate,
          job,
          emailService
        );
        break;

      case 'Hired':
        await handleHiredAutomation(
          applicationId,
          candidate,
          job,
          emailService
        );
        break;

      case 'Rejected':
        await handleRejectionAutomation(
          applicationId,
          candidate,
          job,
          emailService
        );
        break;
    }
  } catch (error) {
    console.error('[ATS AUTOMATION] Error:', error);
  }
}

// Interview automation
async function handleInterviewAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  interviewDetails?: { interviewDate?: string; interviewLocation?: string }
) {
  try {
    // Use provided interview details or defaults
    const interviewDate = interviewDetails?.interviewDate || 'To be scheduled';
    const interviewLocation = interviewDetails?.interviewLocation || 'TBD - Check email for details';

    // Update applications table with confirmation_status=PENDING (simplified, no token)
    const appUpdateResult = await supabaseService.update(
      'applications',
      {
        confirmation_status: 'PENDING',
        interview_date: interviewDate,
        interview_location: interviewLocation
      },
      'application_id',
      applicationId
    );

    if (!appUpdateResult.success) {
      console.error('[INTERVIEW AUTOMATION] Failed to update applications table:', appUpdateResult.message);
      return;
    }

    console.log('[INTERVIEW AUTOMATION] Applications table updated with confirmation_status=PENDING');

    // Send interview invitation email with direct response link (no token needed)
    const emailResult = await emailService.sendInterviewInvitation(
      candidate.email,
      candidate.name,
      job.title,
      interviewDate,
      interviewLocation,
      applicationId
    );

    if (!emailResult.success) {
      console.error('[INTERVIEW AUTOMATION] Failed to send email:', emailResult.error);
    } else {
      console.log('[INTERVIEW AUTOMATION] Email sent successfully for application:', applicationId);
    }
  } catch (error) {
    console.error('[INTERVIEW AUTOMATION] Exception:', error);
  }
}

// Technical test automation
async function handleTechnicalTestAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService
) {
  try {
    const emailResult = await emailService.sendTechnicalTestNotification(
      candidate.email,
      candidate.name,
      job.title,
      `${process.env.FRONTEND_URL}/test/${applicationId}`,
      'Check email for test deadline'
    );

    if (!emailResult.success) {
      console.error('[TECHNICAL TEST AUTOMATION] Failed to send email:', emailResult.error);
    } else {
      console.log('[TECHNICAL TEST AUTOMATION] Email sent successfully for application:', applicationId);
    }
  } catch (error) {
    console.error('[TECHNICAL TEST AUTOMATION] Exception:', error);
  }
}

// Hired automation
async function handleHiredAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService
) {
  try {
    const emailResult = await emailService.sendHiredNotification(
      candidate.email,
      candidate.name,
      job.title
    );

    if (!emailResult.success) {
      console.error('[HIRED AUTOMATION] Failed to send email:', emailResult.error);
    } else {
      console.log('[HIRED AUTOMATION] Email sent successfully for application:', applicationId);
    }
  } catch (error) {
    console.error('[HIRED AUTOMATION] Exception:', error);
  }
}

// Rejection automation
async function handleRejectionAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService
) {
  try {
    const emailResult = await emailService.sendRejectionNotification(
      candidate.email,
      candidate.name,
      job.title
    );

    if (!emailResult.success) {
      console.error('[REJECTION AUTOMATION] Failed to send email:', emailResult.error);
    } else {
      console.log('[REJECTION AUTOMATION] Email sent successfully for application:', applicationId);
    }
  } catch (error) {
    console.error('[REJECTION AUTOMATION] Exception:', error);
  }
}

export default router;
