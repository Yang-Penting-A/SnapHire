/**
 * Interview Invitation Email Template
 * 
 * Reusable template for interview invitation emails.
 * Supports customization of candidate details, interview information,
 * and confirmation links.
 */

interface InterviewInvitationData {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  interviewDate: string;
  interviewDuration?: string; // Tambahan: durasi interview
  interviewLocation: string;
  interviewType?: 'in-person' | 'virtual' | 'phone';
  confirmationLink: string;
  declineLink?: string;
  additionalInstructions?: string;
  hireName?: string;
}

/**
 * Generate interview invitation HTML email
 */
function generateInterviewInvitationHTML(data: InterviewInvitationData): string {
  const {
    candidateName,
    jobTitle,
    companyName = 'SnapHire',
    interviewDate,
    interviewDuration = '60 minutes',
    interviewLocation,
    interviewType = 'in-person',
    confirmationLink,
    declineLink,
    additionalInstructions,
    hireName = 'Recruitment Team',
  } = data;

  // If an HR name is provided, display as "<HR Name> - Recruitment Team",
  // otherwise fall back to 'Recruitment Team'. Avoid duplicating suffix.
  const displayHireName = (hireName && !hireName.toLowerCase().includes('recruitment team'))
    ? `${hireName} - Recruitment Team`
    : 'Recruitment Team';

  // Formatting interview type for display
  const formattedType = interviewType
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

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
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
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
          .interview-details {
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
          .info-box {
            background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
            border-radius: 16px;
            border: 1px solid #bfdbfe;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #1e3a8a;
            line-height: 1.7;
          }
          .info-box strong {
            display: block;
            margin-bottom: 8px;
            color: #1d4ed8;
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
            margin-bottom: 20px;
          }
          .cta-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
          }
          .cta-button:hover {
            box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
          }
          .cta-button.decline {
            background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
            box-shadow: 0 4px 12px rgba(225, 29, 72, 0.2);
          }
          .cta-button.decline:hover {
            box-shadow: 0 6px 16px rgba(225, 29, 72, 0.3);
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
            <h1>Interview Invitation</h1>
            <p>${jobTitle} position</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Dear <strong>${candidateName}</strong>,</p>
              <p>Thank you for applying to ${companyName}. Your application has progressed to the next stage, and we would like to invite you to an interview for the <strong>${jobTitle}</strong> position.</p>
            </div>

            <div class="section-title">Interview Details</div>
            <div class="interview-details">
              <div class="detail-row">
                <div class="detail-label">Date & Time</div>
                <div class="detail-value">${interviewDate}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Duration</div>
                <div class="detail-value">${interviewDuration}</div>
              </div>

              <div class="detail-row">
                <div class="detail-label">Type</div>
                <div class="detail-value">${formattedType}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Location</div>
                <div class="detail-value">${interviewLocation}</div>
              </div>
            </div>

            ${
              additionalInstructions
                ? `
              <div class="info-box">
                <strong>Important Information</strong>
                <p>${additionalInstructions}</p>
              </div>
            `
                : ''
            }

            <div class="cta-section">
              <p class="cta-text">Please confirm your attendance:</p>
              <div class="cta-buttons">
                <a href="${confirmationLink}" class="cta-button">✓ Confirm Interview</a>
                ${declineLink ? `<a href="${declineLink}" class="cta-button decline">✗ Decline</a>` : ''}
              </div>
            </div>

            <p class="note">If you need to reschedule or have any questions about the interview process, please reply to this email. Our team will be happy to assist you.</p>

            <div class="signature">
              <p>Best regards,<br/><strong>${displayHireName}</strong><br/>${companyName}</p>
            </div>
          </div>

          <div class="footer">
            <p style="margin: 0;">This email is sent on behalf of ${companyName}. Replies to this email will be directed to the recruitment team.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export { generateInterviewInvitationHTML, InterviewInvitationData };