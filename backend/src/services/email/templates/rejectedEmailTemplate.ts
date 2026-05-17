/**
 * Rejection Notification Email Template
 * 
 * Professional and respectful rejection email.
 * Maintains positive relationships with candidates for future opportunities.
 */

interface RejectionNotificationData {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  reason?: string; // Optional: brief reason why not selected
  feedbackLink?: string; // Optional: link to feedback or next steps
  hireName?: string;
}

/**
 * Generate rejection notification HTML email
 */
function generateRejectionNotificationHTML(data: RejectionNotificationData): string {
  const {
    candidateName,
    jobTitle,
    companyName = 'SnapHire',
    reason,
    feedbackLink,
    hireName = 'Recruitment Team',
  } = data;

  // If an HR name is provided, display as "<HR Name> - Recruitment Team",
  // otherwise fall back to 'Recruitment Team'. Avoid duplicating suffix.
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
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
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
          .main-message {
            background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
            border-radius: 16px;
            border: 1px solid #cbd5e1;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #334155;
            line-height: 1.7;
          }
          .main-message p {
            margin: 0 0 8px 0;
          }
          .main-message p:last-child {
            margin-bottom: 0;
          }
          .info-box {
            border-radius: 16px;
            border: 1px solid #e0e7ff;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            line-height: 1.7;
          }
          .info-box.appreciation {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border-color: #fca5a5;
            color: #7f1d1d;
          }
          .info-box.appreciation strong {
            color: #991b1b;
          }
          .info-box.future {
            background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%);
            border-color: #fcd34d;
            color: #78350f;
          }
          .info-box.future strong {
            color: #92400e;
          }
          .info-box.feedback {
            background: linear-gradient(135deg, #ecf0ff 0%, #e0e7ff 100%);
            border-color: #c7d2fe;
            color: #3730a3;
          }
          .info-box.feedback strong {
            color: #4f46e5;
          }
          .info-box strong {
            display: block;
            margin-bottom: 8px;
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
            background: linear-gradient(135deg, #64748b 0%, #475569 100%);
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
          .closing {
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
            </div>

            <div class="main-message">
              <p>Thank you for your interest in the <strong>${jobTitle}</strong> position at ${companyName}. We genuinely appreciate the time and effort you invested throughout our interview process.</p>
              <p>After careful review of all candidates, we have decided to move forward with other candidates whose qualifications align more closely with our current organizational needs.</p>
            </div>

            <div class="info-box appreciation">
              <strong>We Recognize Your Effort</strong>
              <p>Your background and experience impressed our team, and we recognize the dedication you demonstrated throughout the hiring process. The decision was not easy, as we received many qualified applications.</p>
            </div>

            <div class="info-box future">
              <strong>Future Opportunities</strong>
              <p>We encourage you to stay connected with us and consider applying for future positions that align with your skills and career goals. Our team regularly posts new openings, and we would welcome the opportunity to connect with you again.</p>
            </div>

            ${
              reason
                ? `
              <div class="info-box feedback">
                <strong>Feedback</strong>
                <p>${reason}</p>
              </div>
            `
                : `
              <div class="info-box feedback">
                <strong>Request Feedback</strong>
                <p>If you would like constructive feedback on your application or interview performance, we encourage you to reply to this email. Our team is happy to provide insights to support your professional development.</p>
              </div>
            `
            }

            ${
              feedbackLink
                ? `
              <div class="cta-section">
                <p class="cta-text">Explore future opportunities:</p>
                <a href="${feedbackLink}" class="cta-button">View Open Positions</a>
              </div>
            `
                : ''
            }

            <p class="closing">We appreciate your interest in ${companyName} and wish you the very best in your career journey. We hope our paths will cross again in the future.</p>

            <div class="signature">
              <p>Sincerely,<br/><strong>${displayHireName}</strong><br/>${companyName}</p>
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

export { generateRejectionNotificationHTML, RejectionNotificationData };
