/**
 * Shortlisted Notification Email Template
 *
 * Used to notify candidates they passed initial screening.
 */

interface ShortlistedNotificationData {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  additionalMessage?: string;
  hireName?: string;
}

function generateShortlistedNotificationHTML(data: ShortlistedNotificationData): string {
  const {
    candidateName,
    jobTitle,
    companyName = 'SnapHire',
    additionalMessage,
    hireName = 'Recruitment Team',
  } = data;

  const displayHireName = (hireName && !hireName.toLowerCase().includes('recruitment team'))
    ? `${hireName} - Recruitment Team`
    : 'Recruitment Team';

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
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
          .status-badge {
            display: inline-block;
            background: linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%);
            border: 1px solid #bfdbfe;
            border-radius: 12px;
            padding: 8px 16px;
            margin: 16px 0 24px 0;
            font-size: 13px;
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.05em;
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
          .next-steps {
            background: linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%);
            border-radius: 16px;
            border: 1px solid #e0e7ff;
            padding: 20px;
            margin: 24px 0;
            font-size: 15px;
            color: #334155;
            line-height: 1.7;
          }
          .next-steps strong {
            display: block;
            margin-bottom: 12px;
            color: #4f46e5;
            font-weight: 700;
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
            <h1>Application Update</h1>
            <p>${jobTitle} position</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Dear <strong>${candidateName}</strong>,</p>
              <p>Thank you for your application for the <strong>${jobTitle}</strong> position. We are pleased to inform you that your application has passed our initial screening.</p>
            </div>

            <div class="status-badge">✓ Shortlisted</div>

            <div class="next-steps">
              <strong>What's Next?</strong>
              <p>Our recruitment team will review your qualifications in detail and be in touch within the next few days with information about the next steps in the hiring process.</p>
            </div>

            ${
              additionalMessage
                ? `
              <div class="info-box">
                <strong>Message from Our Team</strong>
                <p>${additionalMessage}</p>
              </div>
            `
                : ''
            }

            <p class="note">If you have any questions or concerns about your application status, please don't hesitate to reply to this email. Our team is here to help.</p>

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

export { generateShortlistedNotificationHTML, ShortlistedNotificationData };
