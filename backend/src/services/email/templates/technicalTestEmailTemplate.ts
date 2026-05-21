/**
 * Technical Test Invitation Email Template
 * 
 * Supports different types of technical tests:
 * - Assessment: Take-home assignments or online assessments
 * - Live Coding: Live coding sessions with interview
 * - Take Home Project: Multi-hour take-home projects
 * - Online Interview: Remote video interview
 * - Offline Interview: In-person interview
 * - Other: Custom test type
 */

interface TechnicalTestInvitationData {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  testType: 'Assessment' | 'Live Coding' | 'Take Home Project' | 'Online Interview' | 'Offline Interview' | 'Other';
  
  // Assessment / Take Home specific
  assessmentLink?: string;
  deadlineDate?: string;
  deadlineTime?: string;
  estimatedDuration?: string;
  
  // Live Coding specific
  meetingLink?: string;
  scheduleDate?: string;
  scheduleTime?: string;
  duration?: string;
  
  // General
  instructions?: string;
  additionalNotes?: string;
  hireName?: string;
}

/**
 * Generate technical test invitation HTML email
 */
function generateTechnicalTestInvitationHTML(data: TechnicalTestInvitationData): string {
  const {
    candidateName,
    jobTitle,
    companyName = 'SnapHire',
    testType,
    assessmentLink,
    deadlineDate,
    deadlineTime,
    estimatedDuration,
    meetingLink,
    scheduleDate,
    scheduleTime,
    duration,
    instructions,
    additionalNotes,
    hireName = 'Recruitment Team',
  } = data;

  // If an HR name is provided, display as "<HR Name> - Recruitment Team",
  // otherwise fall back to just 'Recruitment Team'. Avoid duplicating suffix.
  const displayHireName = (hireName && !hireName.toLowerCase().includes('recruitment team'))
    ? `${hireName} - Recruitment Team`
    : 'Recruitment Team';

  const formatDuration = (value?: string) => {
    if (!value) {
      return '';
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return '';
    }

    if (/\b(minute|minutes|menit)\b/i.test(normalizedValue)) {
      return normalizedValue;
    }

    return `${normalizedValue} minutes`;
  };

  const displayEstimatedDuration = formatDuration(estimatedDuration);
  const displayDuration = formatDuration(duration);

  // Determine header color and CTA button text based on test type
  const getHeaderColor = () => {
    switch (testType) {
      case 'Assessment':
      case 'Take Home Project':
        return '#f59e0b'; // amber-500
      case 'Live Coding':
      case 'Online Interview':
        return '#8b5cf6'; // violet-500
      case 'Offline Interview':
        return '#06b6d4'; // cyan-500
      default:
        return '#4f46e5'; // indigo-600
    }
  };

  const getCtaButtonText = () => {
    switch (testType) {
      case 'Assessment':
      case 'Take Home Project':
        return 'Start Assessment';
      case 'Live Coding':
        return 'Join Session';
      case 'Online Interview':
        return 'Join Video Call';
      case 'Offline Interview':
        return 'View Details';
      default:
        return 'View Assessment';
    }
  };

  const getHeaderTitle = () => {
    switch (testType) {
      case 'Assessment':
        return `Technical Assessment: ${jobTitle}`;
      case 'Live Coding':
        return `Live Coding Session: ${jobTitle}`;
      case 'Take Home Project':
        return `Take Home Project: ${jobTitle}`;
      case 'Online Interview':
        return `Technical Interview: ${jobTitle}`;
      case 'Offline Interview':
        return `In-Person Technical Interview: ${jobTitle}`;
      default:
        return `Technical Test: ${jobTitle}`;
    }
  };

  const headerColor = getHeaderColor();
  const ctaText = getCtaButtonText();
  const headerTitle = getHeaderTitle();

  // Build test details HTML based on type
  const getTestDetailsHTML = () => {
    if (['Assessment', 'Take Home Project'].includes(testType)) {
      return `
        <div class="test-details">
          <div class="detail-row">
            <div class="detail-label">Test Type</div>
            <div class="detail-value">${testType}</div>
          </div>
          
          ${deadlineDate ? `
            <div class="detail-row">
              <div class="detail-label">Deadline</div>
              <div class="detail-value">${deadlineDate} ${deadlineTime ? `at ${deadlineTime}` : ''}</div>
            </div>
          ` : ''}
          
          ${displayEstimatedDuration ? `
            <div class="detail-row">
              <div class="detail-label">Estimated Time</div>
              <div class="detail-value">${displayEstimatedDuration}</div>
            </div>
          ` : ''}
        </div>
      `;
    } else if (['Live Coding', 'Online Interview'].includes(testType)) {
      return `
        <div class="test-details">
          <div class="detail-row">
            <div class="detail-label">Test Type</div>
            <div class="detail-value">${testType}</div>
          </div>
          
          ${scheduleDate ? `
            <div class="detail-row">
              <div class="detail-label">Schedule</div>
              <div class="detail-value">${scheduleDate} ${scheduleTime ? `at ${scheduleTime}` : ''}</div>
            </div>
          ` : ''}
          
          ${displayDuration ? `
            <div class="detail-row">
              <div class="detail-label">Duration</div>
              <div class="detail-value">${displayDuration}</div>
            </div>
          ` : ''}
          
          ${meetingLink ? `
            <div class="detail-row">
              <div class="detail-label">Meeting Link</div>
              <div class="detail-value"><a href="${meetingLink}" style="color: #4f46e5; text-decoration: underline;">${meetingLink}</a></div>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      return `
        <div class="test-details">
          <div class="detail-row">
            <div class="detail-label">Test Type</div>
            <div class="detail-value">${testType}</div>
          </div>
        </div>
      `;
    }
  };

  const getGreetingMessage = () => {
    switch (testType) {
      case 'Assessment':
        return `You have been invited to complete a technical assessment as part of the interview process for the <strong>${jobTitle}</strong> position.`;
      case 'Live Coding':
        return `You have been invited to participate in a live coding session for the <strong>${jobTitle}</strong> position.`;
      case 'Take Home Project':
        return `You have been invited to complete a take-home project as part of the interview process for the <strong>${jobTitle}</strong> position.`;
      case 'Online Interview':
        return `You have been invited to attend a technical interview via video call for the <strong>${jobTitle}</strong> position.`;
      case 'Offline Interview':
        return `You have been invited to attend an in-person technical interview for the <strong>${jobTitle}</strong> position.`;
      default:
        return `You have been invited to participate in a technical test for the <strong>${jobTitle}</strong> position.`;
    }
  };

  const getCtaLink = () => {
    if (['Assessment', 'Take Home Project'].includes(testType) && assessmentLink) {
      return assessmentLink;
    } else if (['Live Coding', 'Online Interview'].includes(testType) && meetingLink) {
      return meetingLink;
    }
    return '#';
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 16px;
          }
          .container {
            max-width: 600px;
            width: 100%;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 24px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
            color: #ffffff;
            padding: 28px 32px;
          }
          .header h1 {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .header p {
            margin: 0;
            font-size: 14px;
            opacity: 0.95;
          }
          .content {
            padding: 28px 32px;
          }
          .greeting {
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 24px;
            color: #334155;
          }
          .greeting p {
            margin: 0 0 12px 0;
          }
          .greeting p:last-child {
            margin-bottom: 0;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            margin: 24px 0 16px 0;
          }
          .test-details {
            background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
            border-radius: 16px;
            border: 1px solid #e0e7ff;
            padding: 20px;
            margin: 0 0 24px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 16px;
            align-items: flex-start;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: 700;
            color: #4f46e5;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            min-width: 120px;
          }
          .detail-value {
            font-size: 15px;
            color: #0f172a;
            font-weight: 600;
            text-align: right;
            flex: 1;
            margin-left: 16px;
          }
          .detail-value a {
            color: #4f46e5;
            text-decoration: none;
            border-bottom: 1px solid currentColor;
          }
          .info-box {
            background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
            border-radius: 16px;
            border: 1px solid #e0e7ff;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.7;
          }
          .info-box strong {
            display: block;
            margin-bottom: 8px;
            color: #4f46e5;
            font-weight: 700;
          }
          .info-box p {
            margin: 0;
          }
          .cta-section {
            text-align: center;
            margin: 32px 0;
            padding-top: 8px;
          }
          .cta-text {
            font-size: 14px;
            color: #475569;
            margin-bottom: 16px;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor}dd 100%);
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .cta-button:hover {
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          }
          .note {
            font-size: 14px;
            color: #475569;
            margin: 20px 0;
            line-height: 1.7;
          }
          .signature {
            margin-top: 28px;
            font-size: 15px;
            color: #334155;
          }
          .signature p {
            margin: 0;
          }
          .footer {
            background-color: #f8fafc;
            padding: 20px 32px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            text-align: center;
            opacity: 0.85;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Technical Assessment</h1>
            <p>${jobTitle} position</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Dear <strong>${candidateName}</strong>,</p>
              <p>${getGreetingMessage()}</p>
            </div>

            <div class="section-title">Test Details</div>
            ${getTestDetailsHTML()}

            ${
              instructions
                ? `
              <div class="info-box">
                <strong>Instructions</strong>
                <p>${instructions}</p>
              </div>
            `
                : ''
            }

            <div class="cta-section">
              <p class="cta-text">Click below to start:</p>
              <a href="${getCtaLink()}" class="cta-button">${ctaText}</a>
            </div>

            ${
              additionalNotes
                ? `<p class="note">${additionalNotes}</p>`
                : `<p class="note">If you have any questions or need to reschedule, please reply to this email or contact our recruitment team.</p>`
            }

            <div class="signature">
              <p>Best regards,<br/><strong>${displayHireName}</strong><br/>${companyName}</p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">SnapHire Recruitment Platform | This email was sent to ${candidateName}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export { generateTechnicalTestInvitationHTML, TechnicalTestInvitationData };
