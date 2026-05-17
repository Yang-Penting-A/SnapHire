/**
 * Job Offer / Hired Notification Email Template
 * 
 * Professional congratulations email for successful candidates.
 * Includes job title, start date, and onboarding information.
 */

interface HiredNotificationData {
  candidateName: string;
  jobTitle: string;
  companyName?: string;
  startDate?: string;
  salary?: string;
  department?: string;
  manager?: string;
  additionalMessage?: string;
  offerDetailsLink?: string;
  hireName?: string;
}

/**
 * Generate hired notification HTML email
 */
function generateHiredNotificationHTML(data: HiredNotificationData): string {
  const {
    candidateName,
    jobTitle,
    companyName = 'SnapHire',
    startDate,
    salary,
    department,
    manager,
    additionalMessage,
    offerDetailsLink,
    hireName = 'Human Resources Team',
  } = data;

  // If an HR name is provided, display as "<HR Name> - Recruitment Team",
  // otherwise fall back to the default hireName. Avoid duplicating suffix.
  const displayHireName = (hireName && !hireName.toLowerCase().includes('recruitment team'))
    ? `${hireName} - Recruitment Team`
    : hireName;

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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
          .offer-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
            border-radius: 16px;
            border: 1px solid #a7f3d0;
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
            color: #059669;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            min-width: 120px;
          }
          .detail-value {
            font-size: 15px;
            color: #065f46;
            font-weight: 600;
            text-align: right;
            flex: 1;
            margin-left: 16px;
          }
          .info-box {
            background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
            border-radius: 16px;
            border: 1px solid #a7f3d0;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #065f46;
            line-height: 1.7;
          }
          .info-box strong {
            display: block;
            margin-bottom: 8px;
            color: #047857;
            font-weight: 700;
          }
          .info-box p {
            margin: 0;
          }
          .next-steps {
            background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%);
            border-radius: 16px;
            border: 1px solid #fcd34d;
            padding: 16px;
            margin: 24px 0;
            font-size: 14px;
            color: #78350f;
            line-height: 1.7;
          }
          .next-steps strong {
            display: block;
            margin-bottom: 8px;
            color: #92400e;
            font-weight: 700;
          }
          .next-steps ul {
            margin: 0;
            padding-left: 20px;
          }
          .next-steps li {
            margin-bottom: 6px;
          }
          .next-steps li:last-child {
            margin-bottom: 0;
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
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 700;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
          }
          .cta-button:hover {
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
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
            <h1>Employment Offer</h1>
            <p>${jobTitle} position</p>
          </div>
          
          <div class="content">
            <div class="greeting">
              <p>Dear <strong>${candidateName}</strong>,</p>
              <p>Congratulations! We are delighted to offer you the position of <strong>${jobTitle}</strong> at ${companyName}. Your qualifications, experience, and demonstrated excellence throughout our interview process impressed our entire team.</p>
            </div>

            <div class="section-title">Offer Details</div>
            <div class="offer-box">
              <div class="detail-row">
                <div class="detail-label">Position</div>
                <div class="detail-value">${jobTitle}</div>
              </div>
              
              ${department ? `
                <div class="detail-row">
                  <div class="detail-label">Department</div>
                  <div class="detail-value">${department}</div>
                </div>
              ` : ''}
              
              ${startDate ? `
                <div class="detail-row">
                  <div class="detail-label">Start Date</div>
                  <div class="detail-value">${startDate}</div>
                </div>
              ` : ''}
              
              ${salary ? `
                <div class="detail-row">
                  <div class="detail-label">Salary</div>
                  <div class="detail-value">${salary}</div>
                </div>
              ` : ''}
              
              ${manager ? `
                <div class="detail-row">
                  <div class="detail-label">Reporting To</div>
                  <div class="detail-value">${manager}</div>
                </div>
              ` : ''}
            </div>

            ${
              additionalMessage
                ? `
              <div class="info-box">
                <strong>Welcome to Our Team</strong>
                <p>${additionalMessage}</p>
              </div>
            `
                : `
              <div class="info-box">
                <strong>Welcome to Our Team</strong>
                <p>We're excited to have you join us! Our Human Resources team will reach out shortly with onboarding details, benefits information, and your first-day arrangements.</p>
              </div>
            `
            }

            <div class="next-steps">
              <strong>What Happens Next</strong>
              <ul>
                <li>You will receive a formal offer letter with complete employment terms</li>
                <li>Our HR team will contact you with onboarding details and documentation requirements</li>
                <li>You'll learn about our company benefits, policies, and culture</li>
                <li>We'll guide you through all necessary setup and preparation for your start date</li>
              </ul>
            </div>

            ${
              offerDetailsLink
                ? `
              <div class="cta-section">
                <p class="cta-text">Review and accept your offer online:</p>
                <a href="${offerDetailsLink}" class="cta-button">View Full Offer</a>
              </div>
            `
                : ''
            }

            <p class="note">If you have any questions about this offer or need any clarification, please don't hesitate to reach out to our Human Resources team.</p>

            <div class="signature">
              <p>Warmest regards,<br/><strong>${displayHireName}</strong><br/>${companyName}</p>
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

export { generateHiredNotificationHTML, HiredNotificationData };
