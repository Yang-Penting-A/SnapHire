import nodemailer from 'nodemailer';
import { config } from '../../config/config';

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
   * @param confirmationToken Unique token for interview confirmation
   * @returns SendEmailResult with success status
   */
  async sendInterviewInvitation(
    candidateEmail: string,
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    interviewLocation: string,
    confirmationToken: string
  ): Promise<SendEmailResult> {
    try {
      console.log('[ATS Email Service] sendInterviewInvitation called with:', {
        candidateEmail,
        candidateName,
        jobTitle,
        interviewDate,
        interviewLocation,
        tokenLength: confirmationToken?.length
      });

      const backendBase = this.getBackendBaseUrl();
      const confirmationLink = `${backendBase}${config.apiPrefix}/interviews/confirm/${confirmationToken}`;
      console.log('[ATS Email Service] Confirmation link built:', confirmationLink);

      // Build HTML email content
      const htmlContent = this.buildInterviewInvitationHTML(
        candidateName,
        jobTitle,
        interviewDate,
        interviewLocation,
        confirmationLink
      );

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
   * Send technical test notification email
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
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Technical Test for ${jobTitle}</h2>
          <p>Dear ${candidateName},</p>
          <p>You have been invited to complete a technical test as part of the interview process for the <strong>${jobTitle}</strong> position.</p>
          <p><strong>Test Link:</strong> <a href="${testLink}">${testLink}</a></p>
          <p><strong>Deadline:</strong> ${deadline}</p>
          <p>Please complete the test by the deadline. If you have any questions, please reach out to our recruitment team.</p>
          <p>Best regards,<br/>SnapHire Recruitment Team</p>
        </div>
      `;

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Technical Test - ${jobTitle}`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendTechnicalTestNotification:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send hired notification email
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
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations!</h2>
          <p>Dear ${candidateName},</p>
          <p>We are pleased to inform you that you have been selected for the <strong>${jobTitle}</strong> position at SnapHire.</p>
          <p>Our HR team will contact you shortly with details regarding your onboarding and start date.</p>
          <p>Thank you for your interest in joining our team!</p>
          <p>Best regards,<br/>SnapHire Recruitment Team</p>
        </div>
      `;

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Congratulations! You're Hired - ${jobTitle}`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendHiredNotification:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send rejection notification email
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
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Application Status Update</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at SnapHire.</p>
          <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
          <p>We appreciate the time you invested in our interview process and encourage you to apply for future positions that match your skills and experience.</p>
          <p>Best regards,<br/>SnapHire Recruitment Team</p>
        </div>
      `;

      return await this.sendEmail({
        to: candidateEmail,
        subject: `Application Update - ${jobTitle}`,
        html: htmlContent,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ATS Email Service] Exception in sendRejectionNotification:', errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Build HTML content for interview invitation
   */
  private buildInterviewInvitationHTML(
    candidateName: string,
    jobTitle: string,
    interviewDate: string,
    interviewLocation: string,
    confirmationLink: string
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Interview Invitation</h2>
        <p>Dear ${candidateName},</p>
        <p>We are pleased to invite you for an interview for the <strong>${jobTitle}</strong> position at SnapHire.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Interview Details:</strong></p>
          <p><strong>Date & Time:</strong> ${interviewDate}</p>
          <p><strong>Location:</strong> ${interviewLocation}</p>
        </div>
        
        <p>Please confirm your attendance by clicking the button below:</p>
        
        <div style="text-align: center; margin: 20px 0;">
          <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirm Interview
          </a>
        </div>
        
        <p>If you are unable to attend or need to reschedule, please let us know as soon as possible.</p>
        <p>We look forward to meeting you!</p>
        <p>Best regards,<br/>SnapHire Recruitment Team</p>
      </div>
    `;
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
