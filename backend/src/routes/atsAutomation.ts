import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import ATSEmailService from '../services/email/sendEmail';
import { generateInterviewInvitationHTML } from '../services/email/templates';
import { config } from '../config/config';
import crypto from 'crypto';

const router = Router();

/**
 * Trigger ATS automation (email sending) for a status change
 */
router.post('/trigger-ats-email', async (req: Request, res: Response) => {
  try {
    const { applicationId, newStatus, interviewData } = req.body;

    console.log('[ATS AUTOMATION] Trigger request received:', { applicationId, newStatus });

    if (!applicationId || !newStatus) {
      console.error('[ATS AUTOMATION] Missing required fields:', { applicationId, newStatus });
      return res.status(400).json({
        success: false,
        error: 'applicationId and newStatus are required'
      });
    }

    // Fetch application with candidate and job details
    console.log('[ATS AUTOMATION] Fetching application:', applicationId);
    const appResult = await supabaseService.select('applications', 
      { application_id: applicationId }
    );

    if (!appResult.success) {
      console.error('[ATS AUTOMATION] Application fetch failed:', appResult.message);
      return res.status(500).json({
        success: false,
        error: `Application fetch failed: ${appResult.message}`
      });
    }

    if (!appResult.data || appResult.data.length === 0) {
      console.error('[ATS AUTOMATION] Application not found:', applicationId);
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const application = appResult.data[0];
    console.log('[ATS AUTOMATION] Application found:', { 
      application_id: application.application_id,
      candidate_id: application.candidate_id,
      job_id: application.job_id 
    });

    // Fetch candidate details
    console.log('[ATS AUTOMATION] Fetching candidate:', application.candidate_id);
    const candidateResult = await supabaseService.select('candidates',
      { candidate_id: application.candidate_id }
    );

    if (!candidateResult.success) {
      console.error('[ATS AUTOMATION] Candidate fetch failed:', candidateResult.message);
      return res.status(500).json({
        success: false,
        error: `Candidate fetch failed: ${candidateResult.message}`
      });
    }

    if (!candidateResult.data || candidateResult.data.length === 0) {
      console.error('[ATS AUTOMATION] Candidate not found:', application.candidate_id);
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    const candidate = candidateResult.data[0];
    console.log('[ATS AUTOMATION] Candidate found:', { 
      candidate_id: candidate.candidate_id,
      name: candidate.name,
      email: candidate.email 
    });

    // Fetch job details
    console.log('[ATS AUTOMATION] Fetching job:', application.job_id);
    const jobResult = await supabaseService.select('jobs',
      { job_id: application.job_id }
    );

    if (!jobResult.success) {
      console.error('[ATS AUTOMATION] Job fetch failed:', jobResult.message);
      return res.status(500).json({
        success: false,
        error: `Job fetch failed: ${jobResult.message}`
      });
    }

    if (!jobResult.data || jobResult.data.length === 0) {
      console.error('[ATS AUTOMATION] Job not found:', application.job_id);
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const job = jobResult.data[0];
    console.log('[ATS AUTOMATION] Job found:', { 
      job_id: job.job_id,
      title: job.title 
    });

    // Handle ATS automation based on status
    console.log('[ATS AUTOMATION] Creating email service and handling status:', newStatus);
    let emailService: ATSEmailService;
    try {
      emailService = new ATSEmailService();
      console.log('[ATS AUTOMATION] Email service initialized successfully');
    } catch (error) {
      console.error('[ATS AUTOMATION] Email service initialization failed:', error);
      return res.status(500).json({
        success: false,
        error: `Email service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    switch (newStatus) {
      case 'Interview':
        console.log('[ATS AUTOMATION] Handling Interview status');
        await handleInterviewAutomation(applicationId, candidate, job, emailService, interviewData);
        break;

      case 'Technical Test':
        console.log('[ATS AUTOMATION] Handling Technical Test status');
        await handleTechnicalTestAutomation(applicationId, candidate, job, emailService);
        break;

      case 'Hired':
        console.log('[ATS AUTOMATION] Handling Hired status');
        await handleHiredAutomation(applicationId, candidate, job, emailService);
        break;

      case 'Rejected':
        console.log('[ATS AUTOMATION] Handling Rejected status');
        await handleRejectionAutomation(applicationId, candidate, job, emailService);
        break;

      default:
        console.warn('[ATS AUTOMATION] Unknown status:', newStatus);
    }

    console.log('[ATS AUTOMATION] Automation completed successfully for:', newStatus);
    res.json({
      success: true,
      message: `ATS automation triggered for status: ${newStatus}`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ATS AUTOMATION] Exception in trigger-ats-email:', errorMessage);
    console.error('[ATS AUTOMATION] Stack:', error instanceof Error ? error.stack : 'N/A');
    res.status(500).json({
      success: false,
      error: `ATS automation failed: ${errorMessage}`
    });
  }
});

// Interview automation
async function handleInterviewAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  interviewData?: any
) {
  try {
    console.log('[INTERVIEW AUTOMATION] Starting for application:', applicationId);
    console.log('[INTERVIEW AUTOMATION] Interview data:', interviewData);

    // Generate secure confirmation token
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    console.log('[INTERVIEW AUTOMATION] Confirmation token:', confirmationToken);

    // Update applications table with confirmation token and status
    console.log('[INTERVIEW AUTOMATION] Updating applications table with confirmation data');
    const updateResult = await supabaseService.update(
      'applications',
      {
        confirmation_token: confirmationToken,
        confirmation_status: 'PENDING',
        confirmation_expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      'application_id',
      applicationId
    );

    if (!updateResult.success) {
      console.error('[INTERVIEW AUTOMATION] Failed to update applications table:', {
        success: updateResult.success,
        message: updateResult.message
      });
      return;
    }

    console.log('[INTERVIEW AUTOMATION] Confirmation data saved to applications table');

    // Build confirmation link pointing to backend public confirmation endpoint
    const backendBase = (process.env.BACKEND_URL || `http://localhost:${config.port}`).replace(/\/$/, '');
    // Use backend path /api/interviews/confirm/:token
    const confirmationLink = `${backendBase}${config.apiPrefix}/interviews/confirm/${confirmationToken}`;

    console.log('[INTERVIEW AUTOMATION] Confirmation link:', confirmationLink);

    // Prepare email HTML using existing template
    const interviewDateTime = interviewData
      ? `${interviewData.interviewDate || ''} ${interviewData.interviewTime || ''}`.trim()
      : 'TBA';

    const interviewDuration = interviewData && interviewData.interviewDuration
      ? `${interviewData.interviewDuration} minutes`
      : undefined;

    const typeMap: Record<string, any> = {
      'Virtual': 'virtual',
      'In Person': 'in-person',
      'Phone': 'phone'
    };

    const interviewType = interviewData && interviewData.interviewType
      ? typeMap[interviewData.interviewType] || interviewData.interviewType.toString().toLowerCase()
      : 'virtual';

    const emailHtml = generateInterviewInvitationHTML({
      candidateName: candidate.name,
      jobTitle: job.title,
      companyName: process.env.COMPANY_NAME || 'SnapHire',
      interviewDate: interviewDateTime,
      interviewDuration,
      interviewLocation: interviewData?.interviewLocation || 'To be confirmed',
      interviewType,
      confirmationLink,
      additionalInstructions: interviewData?.additionalInstructions,
      hireName: process.env.HIRE_NAME || 'Recruitment Team'
    });

    console.log('[INTERVIEW AUTOMATION] Prepared email HTML, sending via email service');

    const emailResult = await emailService.sendEmail({
      to: candidate.email,
      subject: `Interview Invitation – ${job.title}`,
      html: emailHtml
    });

    if (!emailResult.success) {
      console.error('[INTERVIEW AUTOMATION] Failed to send email:', {
        success: emailResult.success,
        error: emailResult.error
      });
    } else {
      console.log('[INTERVIEW AUTOMATION] Email sent successfully:', {
        messageId: emailResult.messageId,
        to: candidate.email
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[INTERVIEW AUTOMATION] Exception:', errorMessage);
    console.error('[INTERVIEW AUTOMATION] Stack:', error instanceof Error ? error.stack : 'N/A');
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
    console.log('[TECHNICAL TEST AUTOMATION] Starting for application:', applicationId);
    console.log('[TECHNICAL TEST AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    const emailResult = await emailService.sendTechnicalTestNotification(
      candidate.email,
      candidate.name,
      job.title,
      `${process.env.FRONTEND_URL}/test/${applicationId}`,
      'Check email for test details and deadline'
    );

    if (!emailResult.success) {
      console.error('[TECHNICAL TEST AUTOMATION] Failed to send email:', {
        success: emailResult.success,
        error: emailResult.error
      });
    } else {
      console.log('[TECHNICAL TEST AUTOMATION] Email sent successfully:', {
        messageId: emailResult.messageId,
        to: candidate.email
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[TECHNICAL TEST AUTOMATION] Exception:', errorMessage);
    console.error('[TECHNICAL TEST AUTOMATION] Stack:', error instanceof Error ? error.stack : 'N/A');
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
    console.log('[HIRED AUTOMATION] Starting for application:', applicationId);
    console.log('[HIRED AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    const emailResult = await emailService.sendHiredNotification(
      candidate.email,
      candidate.name,
      job.title
    );

    if (!emailResult.success) {
      console.error('[HIRED AUTOMATION] Failed to send email:', {
        success: emailResult.success,
        error: emailResult.error
      });
    } else {
      console.log('[HIRED AUTOMATION] Email sent successfully:', {
        messageId: emailResult.messageId,
        to: candidate.email
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[HIRED AUTOMATION] Exception:', errorMessage);
    console.error('[HIRED AUTOMATION] Stack:', error instanceof Error ? error.stack : 'N/A');
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
    console.log('[REJECTION AUTOMATION] Starting for application:', applicationId);
    console.log('[REJECTION AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    const emailResult = await emailService.sendRejectionNotification(
      candidate.email,
      candidate.name,
      job.title
    );

    if (!emailResult.success) {
      console.error('[REJECTION AUTOMATION] Failed to send email:', {
        success: emailResult.success,
        error: emailResult.error
      });
    } else {
      console.log('[REJECTION AUTOMATION] Email sent successfully:', {
        messageId: emailResult.messageId,
        to: candidate.email
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[REJECTION AUTOMATION] Exception:', errorMessage);
    console.error('[REJECTION AUTOMATION] Stack:', error instanceof Error ? error.stack : 'N/A');
  }
}

export default router;
