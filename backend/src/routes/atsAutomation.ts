import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import ATSEmailService from '../services/email/sendEmail';
import { config } from '../config/config';

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
        await handleTechnicalTestAutomation(applicationId, candidate, job, emailService, interviewData);
        break;

      case 'Shortlisted':
        console.log('[ATS AUTOMATION] Handling Shortlisted status');
        await handleShortlistedAutomation(applicationId, candidate, job, emailService, interviewData);
        break;

      case 'Hired':
        console.log('[ATS AUTOMATION] Handling Hired status');
        await handleHiredAutomation(applicationId, candidate, job, emailService, interviewData);
        break;

      case 'Rejected':
        console.log('[ATS AUTOMATION] Handling Rejected status');
        await handleRejectionAutomation(applicationId, candidate, job, emailService, interviewData);
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

    // Update applications table with confirmation_status=PENDING (simplified, no token)
    console.log('[INTERVIEW AUTOMATION] Updating applications table with confirmation_status=PENDING');
    const updateResult = await supabaseService.update(
      'applications',
      {
        confirmation_status: 'PENDING',
        interview_date: interviewData?.interviewDate || null,
        interview_location: interviewData?.interviewLocation || null
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

    console.log('[INTERVIEW AUTOMATION] Confirmation status saved to applications table');

    // Prepare interview details for email
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

    // Send interview invitation email with direct response link (applicationId, no token)
    console.log('[INTERVIEW AUTOMATION] Sending interview invitation email');
    const emailResult = await emailService.sendInterviewInvitation(
      candidate.email,
      candidate.name,
      job.title,
      interviewDateTime,
      interviewData?.interviewLocation || 'To be confirmed',
      applicationId
    );

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
  emailService: ATSEmailService,
  testData?: any
) {
  try {
    console.log('[TECHNICAL TEST AUTOMATION] Starting for application:', applicationId);
    console.log('[TECHNICAL TEST AUTOMATION] Test data:', testData);
    console.log('[TECHNICAL TEST AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    // Determine test type from testData or default to Assessment
    const testType = testData?.testType || 'Assessment';

    // Prepare test data for email template
    const emailTestData = {
      candidateName: candidate.name,
      jobTitle: job.title,
      testType,
      ...(testData?.assessmentLink && { assessmentLink: testData.assessmentLink }),
      ...(testData?.deadlineDate && { deadlineDate: testData.deadlineDate }),
      ...(testData?.deadlineTime && { deadlineTime: testData.deadlineTime }),
      ...(testData?.estimatedDuration && { estimatedDuration: testData.estimatedDuration }),
      ...(testData?.meetingLink && { meetingLink: testData.meetingLink }),
      ...(testData?.scheduleDate && { scheduleDate: testData.scheduleDate }),
      ...(testData?.scheduleTime && { scheduleTime: testData.scheduleTime }),
      ...(testData?.duration && { duration: testData.duration }),
      ...(testData?.instructions && { instructions: testData.instructions }),
      hireName: process.env.HIRE_NAME || 'Recruitment Team'
    };

    const emailResult = await emailService.sendTechnicalTestEmail(
      candidate.email,
      candidate.name,
      job.title,
      testType,
      emailTestData
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
  emailService: ATSEmailService,
  hiredData?: any
) {
  try {
    console.log('[HIRED AUTOMATION] Starting for application:', applicationId);
    console.log('[HIRED AUTOMATION] Hired data:', hiredData);
    console.log('[HIRED AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    // Prepare hired data for email template
    const emailHiredData = {
      candidateName: candidate.name,
      jobTitle: hiredData?.jobTitle || job.title,
      ...(hiredData?.startDate && { startDate: hiredData.startDate }),
      ...(hiredData?.salary && { salary: hiredData.salary }),
      ...(hiredData?.department && { department: hiredData.department }),
      ...(hiredData?.manager && { manager: hiredData.manager }),
      ...(hiredData?.additionalMessage && { additionalMessage: hiredData.additionalMessage }),
      hireName: process.env.HIRE_NAME || 'Human Resources Team'
    };

    const emailResult = await emailService.sendHiredEmail(
      candidate.email,
      candidate.name,
      job.title,
      emailHiredData
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
  emailService: ATSEmailService,
  rejectionData?: any
) {
  try {
    console.log('[REJECTION AUTOMATION] Starting for application:', applicationId);
    console.log('[REJECTION AUTOMATION] Rejection data:', rejectionData);
    console.log('[REJECTION AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    // Prepare rejection data for email template
    const emailRejectionData = {
      candidateName: candidate.name,
      jobTitle: job.title,
      ...(rejectionData?.reason && { reason: rejectionData.reason }),
      hireName: process.env.HIRE_NAME || 'Recruitment Team'
    };

    const emailResult = await emailService.sendRejectionEmail(
      candidate.email,
      candidate.name,
      job.title,
      emailRejectionData
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

// Shortlisted automation
async function handleShortlistedAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  shortlistData?: any
) {
  try {
    console.log('[SHORTLISTED AUTOMATION] Starting for application:', applicationId);
    console.log('[SHORTLISTED AUTOMATION] Shortlist data:', shortlistData);
    console.log('[SHORTLISTED AUTOMATION] Email details:', {
      to: candidate.email,
      candidateName: candidate.name,
      jobTitle: job.title
    });

    const emailShortlistData = {
      candidateName: candidate.name,
      jobTitle: job.title,
      ...(shortlistData?.additionalMessage && { additionalMessage: shortlistData.additionalMessage }),
      hireName: process.env.HIRE_NAME || 'Recruitment Team'
    };

    const emailResult = await emailService.sendShortlistedEmail(
      candidate.email,
      candidate.name,
      job.title,
      emailShortlistData
    );

    if (!emailResult.success) {
      console.error('[SHORTLISTED AUTOMATION] Failed to send email:', {
        success: emailResult.success,
        error: emailResult.error
      });
    } else {
      console.log('[SHORTLISTED AUTOMATION] Email sent successfully:', {
        messageId: emailResult.messageId,
        to: candidate.email
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[SHORTLISTED AUTOMATION] Exception:', errorMessage);
    console.error('[SHORTLISTED AUTOMATION] Stack:', error instanceof Error ? error.stack : 'N/A');
  }
}

export default router;
