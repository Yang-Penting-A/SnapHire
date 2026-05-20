import { Router } from 'express';
import authRouter from './auth.routes';
import jobsRouter from './jobs.routes';
import usersRouter from './users.routes';
import cvRouter from './cv-upload.route';
import emailRouter from './email.routes';
import atsAutomationRouter from './ats.routes';
import interviewsRouter from './interview-response.route';

const router = Router();

// Protected routes requiring authentication
router.use(authRouter);
router.use(jobsRouter);
router.use(usersRouter);
router.use('/cv', cvRouter);
router.use('/email', emailRouter);

// ATS automation trigger - no auth required (triggered after status update)
router.use('/applications', atsAutomationRouter);

// Public interview confirmation endpoint (token confirmation)
router.use('/interviews', interviewsRouter);

export default router;
