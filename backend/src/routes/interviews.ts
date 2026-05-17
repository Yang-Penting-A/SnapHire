import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';

const router = Router();

// Public endpoint: confirm interview via token
router.get('/confirm/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).type('html').send('<h1>Invalid Request</h1><p>Missing token.</p>');
      return;
    }

    // Lookup token
    const tokenResult = await supabaseService.select('confirmation_tokens', { token });

    if (!tokenResult.success || !tokenResult.data || tokenResult.data.length === 0) {
      res.status(404).type('html').send('<h1>Invalid or expired token</h1><p>The confirmation token was not found.</p>');
      return;
    }

    const confirmationToken = tokenResult.data[0];

    // Check expiry
    if (confirmationToken.expires_at && new Date(confirmationToken.expires_at) < new Date()) {
      res.status(400).type('html').send('<h1>Token Expired</h1><p>This confirmation link has expired.</p>');
      return;
    }

    // Check already used
    if (confirmationToken.used_at) {
      res.status(400).type('html').send('<h1>Already Confirmed</h1><p>This interview has already been confirmed.</p>');
      return;
    }

    // Mark token used
    await supabaseService.update('confirmation_tokens', { used_at: new Date() }, 'token', token);

    // If token references an application, update applications confirmation_status
    if (confirmationToken.application_id) {
      await supabaseService.update('applications',
        { confirmation_status: 'CONFIRMED', confirmation_confirmed_at: new Date() },
        'application_id',
        confirmationToken.application_id
      );

      // Try to fetch the application to also update candidate timestamp
      const appRes = await supabaseService.select('applications', { application_id: confirmationToken.application_id });
      if (appRes.success && appRes.data && appRes.data.length > 0) {
        const app = appRes.data[0];
        if (app.candidate_id) {
          await supabaseService.update('candidates', { interview_confirmed_at: new Date() }, 'candidate_id', app.candidate_id);
        }
      }
    }

    // If token references a candidate directly, update candidate
    if (confirmationToken.candidate_id) {
      await supabaseService.update('candidates', { interview_confirmed_at: new Date() }, 'candidate_id', confirmationToken.candidate_id);
    }

    // Minimal success HTML
    res.type('html').send(`
      <html>
        <head><meta charset="utf-8"><title>Interview Confirmed</title></head>
        <body style="font-family: Arial, sans-serif; text-align:center; padding:40px;">
          <h1>Interview Confirmed</h1>
          <p>Thank you for confirming your interview schedule. We have recorded your confirmation.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('[INTERVIEWS] Error confirming token:', error);
    res.status(500).type('html').send('<h1>Error</h1><p>Unable to confirm interview at this time.</p>');
  }
});

export default router;
