import { supabaseService } from '../services/supabase';
import ATSEmailService from '../services/email/sendEmail';

// Handle ATS automation for specific statuses
export async function handleAtsAutomation(
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
    const interviewDate = interviewDetails?.interviewDate || 'To be scheduled';
    const interviewLocation = interviewDetails?.interviewLocation || 'TBD - Check email for details';

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

    const testType = testData?.testType || 'Assessment';

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

export {
  handleInterviewAutomation,
  handleTechnicalTestAutomation,
  handleHiredAutomation,
  handleRejectionAutomation,
  handleShortlistedAutomation
};
