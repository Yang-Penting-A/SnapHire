import { supabaseService } from '../services/supabase';
import ATSEmailService from '../services/email/sendEmail';

export async function handleAtsAutomation(
  status: string,
  applicationId: string,
  candidate: any,
  job: any,
  application: any,
  automationData?: {
    interviewDate?: string;
    interviewLocation?: string;
    interviewDuration?: string;
    technicalTestData?: any;
    shortlistedData?: any;
  }
) {
  try {
    if (!candidate) throw new Error('Missing candidate data');
    if (!job) throw new Error('Missing job data');
    if (!applicationId) throw new Error('Missing applicationId');
    
    let emailService: ATSEmailService;
    try {
      emailService = new ATSEmailService();
    } catch (initError) {
      const errorMsg = initError instanceof Error ? initError.message : String(initError);
      console.error('[ATS SERVICE EMAIL INIT ERROR]', errorMsg);
      throw new Error(`Failed to initialize email service: ${errorMsg}`);
    }

    switch (status) {
      case 'Interview':
        await handleInterviewAutomation(
          applicationId,
          candidate,
          job,
          emailService,
          automationData
        );
        break;

      case 'Technical Test':
        await handleTechnicalTestAutomation(
          applicationId,
          candidate,
          job,
          emailService,
          automationData?.technicalTestData
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

      case 'Shortlisted':
        await handleShortlistedAutomation(
          applicationId,
          candidate,
          job,
          emailService,
          automationData?.shortlistedData
        );
        break;
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[ATS SERVICE] Automation failed:', errorMsg);
    throw error;
  }
}

async function handleInterviewAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  interviewDetails?: { interviewDate?: string; interviewLocation?: string; interviewDuration?: string }
) {
  try {
    const interviewDate = interviewDetails?.interviewDate || 'To be scheduled';
    const interviewLocation = interviewDetails?.interviewLocation || 'TBD - Check email for details';
    const interviewDuration = interviewDetails?.interviewDuration?.trim();

    const baseUpdateData = {
      confirmation_status: 'PENDING',
      interview_date: interviewDate,
      interview_location: interviewLocation,
    };

    const updateData = interviewDuration
      ? { ...baseUpdateData, interview_duration: interviewDuration }
      : baseUpdateData;

    let appUpdateResult = await supabaseService.update(
      'applications',
      updateData,
      'application_id',
      applicationId
    );

    if (!appUpdateResult.success && interviewDuration) {
      appUpdateResult = await supabaseService.update(
        'applications',
        baseUpdateData,
        'application_id',
        applicationId
      );
    }

    if (!appUpdateResult.success) {
      console.error('[INTERVIEW AUTOMATION] Failed to update applications table:', appUpdateResult.message);
      return;
    }

    const emailResult = await emailService.sendInterviewInvitation(
      candidate.email,
      candidate.name,
      job.title,
      interviewDate,
      interviewLocation,
      applicationId,
      interviewDuration
    );

    if (!emailResult.success) {
      console.error('[INTERVIEW AUTOMATION] Failed to send email:', emailResult.error);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[INTERVIEW AUTOMATION] Exception:', errorMessage);
  }
}

async function handleTechnicalTestAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  testData?: any
) {
  try {
    if (!candidate?.email) throw new Error('Candidate email missing');
    if (!candidate?.name) throw new Error('Candidate name missing');
    if (!job?.title) throw new Error('Job title missing');

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
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[TECHNICAL TEST AUTOMATION] Exception:', errorMessage);
    throw error;
  }
}

async function handleHiredAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  hiredData?: any
) {
  try {
    if (!candidate?.email) throw new Error('Candidate email missing');
    if (!candidate?.name) throw new Error('Candidate name missing');
    if (!job?.title) throw new Error('Job title missing');

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
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[HIRED AUTOMATION] Exception:', errorMessage);
    throw error;
  }
}

async function handleRejectionAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  rejectionData?: any
) {
  try {
    if (!candidate?.email) throw new Error('Candidate email missing');
    if (!candidate?.name) throw new Error('Candidate name missing');
    if (!job?.title) throw new Error('Job title missing');

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
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[REJECTION AUTOMATION] Exception:', errorMessage);
    throw error;
  }
}

async function handleShortlistedAutomation(
  applicationId: string,
  candidate: any,
  job: any,
  emailService: ATSEmailService,
  shortlistData?: any
) {
  try {
    if (!candidate?.email) throw new Error('Candidate email missing');
    if (!candidate?.name) throw new Error('Candidate name missing');
    if (!job?.title) throw new Error('Job title missing');

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
      throw new Error(`Failed to send email: ${emailResult.error}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[SHORTLISTED AUTOMATION] Exception:', errorMessage);
    throw error;
  }
}

export {
  handleInterviewAutomation,
  handleTechnicalTestAutomation,
  handleHiredAutomation,
  handleRejectionAutomation,
  handleShortlistedAutomation
};
