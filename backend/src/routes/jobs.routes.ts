import { Router } from 'express';
import { authMiddleware } from '../core/middlewares/auth.middleware';
import { requireRole, onlyAdmin } from '../core/middlewares/role.middleware';
import { getJobs, createJob, deleteJob } from '../controllers/jobs.controller';

const router = Router();

router.get('/jobs', authMiddleware, getJobs);

router.post('/jobs', authMiddleware, requireRole(['admin', 'hr']), createJob);

router.delete('/jobs/:id', authMiddleware, onlyAdmin, deleteJob);

export default router;