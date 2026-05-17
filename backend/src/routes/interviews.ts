import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';

const router = Router();

/**
 * SIMPLIFIED interview response endpoint (NEW)
 * 
 * Candidate responds directly to interview invitation without token validation.
 * 
 * GET /api/interviews/respond?id=APPLICATION_ID&status=CONFIRMED|DECLINED
 * 
 * No authentication required (links are public but scoped to application_id)
 */
router.get('/respond', async (req: Request, res: Response) => {
  try {
    const { id, status } = req.query;

    // Validate input
    if (!id || typeof id !== 'string') {
      console.error('[INTERVIEW RESPONSE] Missing or invalid application_id');
      return res.status(400).type('html').send(
        `<html><head><meta charset="utf-8"><title>Error</title></head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
         <h1>Invalid Request</h1><p>Missing application ID.</p></body></html>`
      );
    }

    if (!status || !['CONFIRMED', 'DECLINED'].includes(String(status).toUpperCase())) {
      console.error('[INTERVIEW RESPONSE] Invalid status:', status);
      return res.status(400).type('html').send(
        `<html><head><meta charset="utf-8"><title>Error</title></head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
         <h1>Invalid Request</h1><p>Status must be CONFIRMED or DECLINED.</p></body></html>`
      );
    }

    const applicationId = id as string;
    const responseStatus = String(status).toUpperCase();

    console.log('[INTERVIEW RESPONSE] Processing:', { applicationId, responseStatus });

    // Fetch application
    const appRes = await supabaseService.select('applications', { application_id: applicationId });

    if (!appRes.success || !appRes.data || appRes.data.length === 0) {
      console.warn('[INTERVIEW RESPONSE] Application not found:', applicationId);
      return res.status(404).type('html').send(
        `<html><head><meta charset="utf-8"><title>Not Found</title></head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
         <h1>Application Not Found</h1><p>Unable to find this interview invitation.</p></body></html>`
      );
    }

    const application = appRes.data[0];

    // Check if application status is Interview
    if (application.status_application?.toLowerCase() !== 'interview') {
      console.warn('[INTERVIEW RESPONSE] Application is not in Interview status:', applicationId);
      return res.status(400).type('html').send(
        `<html><head><meta charset="utf-8"><title>Invalid Status</title></head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
         <h1>Invalid Status</h1><p>This application is not scheduled for an interview.</p></body></html>`
      );
    }

    // Check if already responded
    if (application.confirmation_status && ['CONFIRMED', 'DECLINED'].includes(application.confirmation_status.toUpperCase())) {
      console.warn('[INTERVIEW RESPONSE] Already responded:', { applicationId, current_status: application.confirmation_status });
      return res.status(400).type('html').send(
        `<html><head><meta charset="utf-8"><title>Already Processed</title></head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
         <h1>Already Responded</h1><p>You have already responded to this interview invitation.</p></body></html>`
      );
    }

    // Update based on response
    let updateData: any = {
      confirmation_status: responseStatus,
    };

    if (responseStatus === 'CONFIRMED') {
      updateData.confirmed_at = new Date();
    } else if (responseStatus === 'DECLINED') {
      updateData.declined_at = new Date();
    }

    console.log('[INTERVIEW RESPONSE] Updating application:', { applicationId, updateData });

    const updateRes = await supabaseService.update(
      'applications',
      updateData,
      'application_id',
      applicationId
    );

    if (!updateRes.success) {
      console.error('[INTERVIEW RESPONSE] Failed to update application:', updateRes.message);
      return res.status(500).type('html').send(
        `<html><head><meta charset="utf-8"><title>Error</title></head>
         <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
         <h1>Error</h1><p>Unable to process your response. Please try again.</p></body></html>`
      );
    }

    // Update candidate timestamps if available
    if (application.candidate_id) {
      if (responseStatus === 'CONFIRMED') {
        await supabaseService.update('candidates',
          { interview_confirmed_at: new Date() },
          'candidate_id',
          application.candidate_id
        ).catch(e => console.error('[INTERVIEW RESPONSE] Failed to update candidate confirmed_at:', e));
      } else if (responseStatus === 'DECLINED') {
        await supabaseService.update('candidates',
          { interview_declined_at: new Date() },
          'candidate_id',
          application.candidate_id
        ).catch(e => console.error('[INTERVIEW RESPONSE] Failed to update candidate declined_at:', e));
      }
    }

    console.log('[INTERVIEW RESPONSE] ✅ Response recorded successfully:', { applicationId, responseStatus });

    // Return success page
    if (responseStatus === 'CONFIRMED') {
      return res.type('html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interview Confirmed</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                padding: 40px;
                max-width: 450px;
                text-align: center;
                animation: slideUp 0.5s ease-out;
              }
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .icon {
                font-size: 56px;
                margin-bottom: 16px;
                display: inline-block;
              }
              h1 {
                color: #1e293b;
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 12px;
                letter-spacing: -0.5px;
              }
              p {
                color: #64748b;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 24px;
              }
              .footer-text {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✓</div>
              <h1>Interview Confirmed</h1>
              <p>Thank you for confirming your interview. The recruitment team has been notified and will be in touch with any further details.</p>
              <p class="footer-text">You can now close this page.</p>
            </div>
          </body>
        </html>
      `);
    } else {
      return res.type('html').send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Interview Declined</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
              }
              .container {
                background: white;
                border-radius: 24px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
                padding: 40px;
                max-width: 450px;
                text-align: center;
                animation: slideUp 0.5s ease-out;
              }
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .icon {
                font-size: 56px;
                margin-bottom: 16px;
                display: inline-block;
              }
              h1 {
                color: #1e293b;
                font-size: 28px;
                font-weight: 800;
                margin-bottom: 12px;
                letter-spacing: -0.5px;
              }
              p {
                color: #64748b;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 24px;
              }
              .footer-text {
                font-size: 12px;
                color: #94a3b8;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="icon">✗</div>
              <h1>Interview Declined</h1>
              <p>Thank you for letting us know. We appreciate your interest and wish you the best in your career.</p>
              <p class="footer-text">You can now close this page.</p>
            </div>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('[INTERVIEW RESPONSE] Exception:', error);
    res.status(500).type('html').send(
      `<html><head><meta charset="utf-8"><title>Error</title></head>
       <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 40px;">
       <h1>Error</h1><p>An unexpected error occurred. Please try again later.</p></body></html>`
    );
  }
});

export default router;
