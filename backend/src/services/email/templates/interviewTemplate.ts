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
    additionalInstructions,
    hireName = 'Recruitment Team',
  } = data;

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
            color: #1e293b; /* Tailwind slate-800 */
            background-color: #f8fafc; /* Tailwind slate-50 */
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            border: 1px solid #e2e8f0; /* Tailwind slate-200 */
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header {
            background-color: #4f46e5; /* Tailwind indigo-600 */
            color: #ffffff;
            padding: 24px 32px;
            border-bottom: 4px solid #4338ca;
          }
          .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.025em;
          }
          .content {
            padding: 32px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 24px;
            color: #334155;
          }
          .interview-details {
            background-color: #f1f5f9; /* Tailwind slate-100 */
            border-radius: 6px;
            padding: 20px;
            margin: 24px 0;
          }
          .detail-row {
            display: table;
            width: 100%;
            margin-bottom: 12px;
          }
          .detail-row:last-child {
            margin-bottom: 0;
          }
          .detail-label {
            display: table-cell;
            width: 120px;
            font-weight: 600;
            color: #64748b; /* Tailwind slate-500 */
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            vertical-align: top;
          }
          .detail-value {
            display: table-cell;
            font-size: 15px;
            color: #0f172a; /* Tailwind slate-900 */
            font-weight: 500;
          }
          .instructions {
            background-color: #eff6ff; /* Tailwind blue-50 */
            border-left: 4px solid #3b82f6; /* Tailwind blue-500 */
            padding: 16px;
            margin: 24px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #1e3a8a;
          }
          .instructions strong {
            display: block;
            margin-bottom: 4px;
            color: #1d4ed8;
          }
          .instructions p {
            margin: 0;
          }
          .cta-section {
            text-align: center;
            margin: 32px 0;
            padding-top: 16px;
          }
          .cta-button {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff;
            padding: 12px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
            transition: background-color 0.2s;
          }
          .cta-button:hover {
            background-color: #4338ca;
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px 32px;
            border-top: 1px solid #e2e8f0;
            font-size: 13px;
            color: #64748b;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Interview Invitation: ${jobTitle}</h1>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Dear <strong>${candidateName}</strong>,</p>
              <p>Thank you for applying to ${companyName}. Your application has progressed to the next stage. You are invited to attend an interview for the <strong>${jobTitle}</strong> position.</p>
            </div>

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
                <div class="detail-label">Location</div>
                <div class="detail-value">${interviewLocation}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Type</div>
                <div class="detail-value">${formattedType}</div>
              </div>
            </div>

            ${
              additionalInstructions
                ? `
              <div class="instructions">
                <strong>Important Instructions</strong>
                <p>${additionalInstructions}</p>
              </div>
            `
                : ''
            }

            <div class="cta-section">
              <p style="margin-bottom: 16px; color: #334155;">Please confirm your attendance by clicking the button below:</p>
              <a href="${confirmationLink}" class="cta-button" style="display:inline-block;background-color:#4f46e5;color:#ffffff !important;-webkit-text-fill-color:#ffffff;padding:12px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">Confirm Interview</a>
            </div>

            <p style="font-size: 14px; color: #475569;">Should there be a need to reschedule, or if you have any inquiries regarding the interview process, please reply directly to this email.</p>

            <p style="margin-top: 32px; font-size: 15px; color: #334155;">
              Best regards,<br/>
              <strong>${hireName}</strong><br/>
              ${companyName}
            </p>
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