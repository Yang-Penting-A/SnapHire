import { Router } from 'express';
import authRouter from './auth.routes';
import jobsRouter from './jobs.routes';
import usersRouter from './users.routes';
import cvRouter from './cv-upload.route';
import emailRouter from './email.routes';
import atsAutomationRouter from './ats.routes';
import interviewsRouter from './interview-response.route';
import sendEmailRouter from '../api/auth/send';

const router = Router();

// Keep main routers from HEAD
router.use(authRouter);
router.use(jobsRouter);
router.use(usersRouter);

// Keep CV and Email route mounts from HEAD
router.use('/cv', cvRouter);
router.use('/email', emailRouter);

// Add new send-email endpoint from incoming branch (kept separate under /auth)
router.use('/auth', sendEmailRouter);

// ATS automation trigger - protected endpoint (requires authenticated HR/Admin)
router.use('/applications', atsAutomationRouter);

// Public interview confirmation endpoint (token confirmation)
router.use('/interviews', interviewsRouter);

export default router;
