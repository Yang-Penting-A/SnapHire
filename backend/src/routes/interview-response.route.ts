import { Router } from 'express';
import { respondToInterview } from '../controllers/interview.controller';

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
router.get('/respond', respondToInterview);

export default router;
