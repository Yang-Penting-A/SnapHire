import nodemailer from 'nodemailer';
import { config } from '../../config/config';
import {
  generateInterviewInvitationHTML,
  generateTechnicalTestInvitationHTML,
  generateHiredNotificationHTML,
  generateRejectionNotificationHTML,
  generateShortlistedNotificationHTML,
  TechnicalTestInvitationData,
  HiredNotificationData,
  RejectionNotificationData,
  ShortlistedNotificationData,
} from './templates';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class ATSEmailService {
  private transporter: nodemailer.Transporter;
  private emailFrom: string;
  private frontendUrl: string;

  constructor() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_APP_PASSWORD;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!emailUser) {
      throw new Error('Missing EMAIL_USER in environment variables');
    }

    if (!emailPassword) {
      throw new Error('Missing EMAIL_APP_PASSWORD in environment variables');
    }

    if (!frontendUrl) {
      throw new Error('Missing FRONTEND_URL in environment variables');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    this.emailFrom = `SnapHire <${emailUser}>`;
    this.frontendUrl = frontendUrl;

    console.log('[ATS Email Service] Initialized with Gmail SMTP:', {
      user: emailUser,
      frontendUrl: frontendUrl
    });
  }

  private getBackendBaseUrl(): string {
    const configuredBackendUrl = process.env.BACKEND_URL?.trim();

    if (configuredBackendUrl) {
      return configuredBackendUrl.replace(/\/$/, '');
    }

    return `http://localhost:${config.port}`;
  }

  /**
   * Send a transactional email
   * 
   * @param payload Email payload with recipient, subject, and HTML content
   * @returns SendEmailResult with success status and messageId or error
   */
  async sendEmail(payload: EmailPayload): Promise<SendEmailResult> {
    try {
      if (!payload.to || !payload.subject || !payload.html) {
        console.warn('[ATS Email Service] Missing required email fields:', {
          hasTo: !!payload.to,
          hasSubject: !!payload.subject,
          hasHtml: !!payload.html
        });
        return {
          success: false,
          error: 'Missing required fields: to, subject, html',
        };
      }

      console.log('[ATS Email Service] Preparing to send email:', {
        from: this.emailFrom,
        to: payload.to,
        subject: payload.subject,
        htmlLength: payload.html.length
      });

      const response = await this.transporter.sendMail({
        from: this.emailFrom,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        replyTo: payload.replyTo || this.emailFrom,
      });

      console.log('[ATS Email Service] Email sent successfully:', {
        to: payload.to,
        messageId: response.messageId,
        response: response.response
      });

      return {
        success: true,
        messageId: response.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      console.error('[ATS Email Service] Exception sending email:', {
        message: errorMessage,
        stack: errorStack
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send interview invitation email
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param interviewDate Date and time of the interview
   * @param interviewLocation Location of the interview (physical or meeting link)
   * @param applicationId Application ID for direct response link (simplified, no token)
   * @returns SendEmailResult with success status
   */
  async sendInterviewInvitation(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    interviewLocation: string,
    applicationId: string
  ): Promise<SendEmailResult> {
    try {
      console.log('[ATS Email Service] sendInterviewInvitation called with:', {
        candidateEmail,
        candidateName,
        jobTitle,
        interviewDate,
        interviewLocation,
        applicationId
      });

      const backendBase = this.getBackendBaseUrl();
      // Simplified direct response links using application_id (no token)
      const confirmationLink = `${backendBase}${config.apiPrefix}/interviews/respond?id=${applicationId}&status=CONFIRMED`;
      const declineLink = `${backendBase}${config.apiPrefix}/interviews/respond?id=${applicationId}&status=DECLINED`;
      console.log('[ATS Email Service] Confirmation link built:', confirmationLink);
      console.log('[ATS Email Service] Decline link built:', declineLink);

      // Build HTML email content using template
      const htmlContent = generateInterviewInvitationHTML({
        candidateName,
        jobTitle,
        interviewDate,
        interviewLocation,
        confirmationLink,
        declineLink,
      });

      console.log('[ATS Email Service] HTML content built, length:', htmlContent.length);

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Interview Invitation - ${jobTitle} at SnapHire`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : '';
      console.error('[ATS Email Service] Exception in sendInterviewInvitation:', {
        message: errorMessage,
        stack: errorStack
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send technical test invitation email
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param testType Type of test (Assessment, Live Coding, Take Home Project, etc.)
   * @param testData Additional test-specific data
   * @returns SendEmailResult with success status
   */
  async sendTechnicalTestEmail(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    testType: 'Assessment' | 'Live Coding' | 'Take Home Project' | 'Online Interview' | 'Offline Interview' | 'Other',
    testData: Partial<TechnicalTestInvitationData> = {}
  ): Promise<SendEmailResult> {
    try {
      console.log('[ATS Email Service] sendTechnicalTestEmail called with:', {
        candidateEmail,
        candidateName,
        jobTitle,
        testType,
        testDataKeys: Object.keys(testData)
      });

      const htmlContent = generateTechnicalTestInvitationHTML({
        candidateName,
        jobTitle,
        testType,
        ...testData,
      });

      console.log('[ATS Email Service] Technical Test HTML built, length:', htmlContent.length);

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Technical Test Invitation - ${jobTitle} at SnapHire`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendTechnicalTestEmail:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send technical test notification email (legacy method, kept for backwards compatibility)
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param testLink Link to the technical test
   * @param deadline Deadline for completing the test
   * @returns SendEmailResult with success status
   */
  async sendTechnicalTestNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    testLink: string,
    deadline: string
  ): Promise<SendEmailResult> {
    return this.sendTechnicalTestEmail(
      candidateEmail,
      candidateName,
      jobTitle,
      'Assessment',
      {
        assessmentLink: testLink,
        deadlineDate: deadline,
      }
    );
  }

  /**
   * Send hired notification email
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param hiredData Additional offer details
   * @returns SendEmailResult with success status
   */
  async sendHiredEmail(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    hiredData: Partial<HiredNotificationData> = {}
  ): Promise<SendEmailResult> {
    try {
      console.log('[ATS Email Service] sendHiredEmail called with:', {
        candidateEmail,
        candidateName,
        jobTitle,
        hiredDataKeys: Object.keys(hiredData)
      });

      const htmlContent = generateHiredNotificationHTML({
        candidateName,
        jobTitle,
        ...hiredData,
      });

      console.log('[ATS Email Service] Hired HTML built, length:', htmlContent.length);

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Offer for ${jobTitle} at SnapHire`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendHiredEmail:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send hired notification email (legacy method, kept for backwards compatibility)
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @returns SendEmailResult with success status
   */
  async sendHiredNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string
  ): Promise<SendEmailResult> {
    return this.sendHiredEmail(candidateEmail, candidateName, jobTitle);
  }

  /**
   * Send rejection notification email
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @param rejectionData Additional rejection details
   * @returns SendEmailResult with success status
   */
  async sendRejectionEmail(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    rejectionData: Partial<RejectionNotificationData> = {}
  ): Promise<SendEmailResult> {
    try {
      console.log('[ATS Email Service] sendRejectionEmail called with:', {
        candidateEmail,
        candidateName,
        jobTitle,
        rejectionDataKeys: Object.keys(rejectionData)
      });

      const htmlContent = generateRejectionNotificationHTML({
        candidateName,
        jobTitle,
        ...rejectionData,
      });

      console.log('[ATS Email Service] Rejection HTML built, length:', htmlContent.length);

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Application Update - ${jobTitle} at SnapHire`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendRejectionEmail:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send rejection notification email (legacy method, kept for backwards compatibility)
   * 
   * @param candidateEmail Email address of the candidate
   * @param candidateName Name of the candidate
   * @param jobTitle Title of the job position
   * @returns SendEmailResult with success status
   */
  async sendRejectionNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string
  ): Promise<SendEmailResult> {
    return this.sendRejectionEmail(candidateEmail, candidateName, jobTitle);
  }

  /**
   * Send shortlisted notification email
   */
  async sendShortlistedEmail(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    shortlistedData: Partial<ShortlistedNotificationData> = {}
  ): Promise<SendEmailResult> {
    try {
      console.log('[ATS Email Service] sendShortlistedEmail called with:', {
        candidateEmail,
        candidateName,
        jobTitle,
        shortlistedDataKeys: Object.keys(shortlistedData)
      });

      const htmlContent = generateShortlistedNotificationHTML({
        candidateName,
        jobTitle,
        ...shortlistedData,
      });

      console.log('[ATS Email Service] Shortlisted HTML built, length:', htmlContent.length);

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Application Update – ${jobTitle}` + ' at SnapHire',
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendShortlistedEmail:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Legacy alias for shortlisted notification
   */
  async sendShortlistedNotification(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    shortlistedData: Partial<ShortlistedNotificationData> = {}
  ): Promise<SendEmailResult> {
    return this.sendShortlistedEmail(candidateEmail, candidateName, jobTitle, shortlistedData);
  }

  /**
   * Get frontend URL for building links
   */
  getFrontendUrl(): string {
    return this.frontendUrl;
  }

  /**
   * Get email from address
   */
  getEmailFrom(): string {
    return this.emailFrom;
  }
}

export default ATSEmailService;
