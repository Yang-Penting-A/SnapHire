import { Router } from 'express';
import { authMiddleware } from '../core/middlewares/auth.middleware';
import { onlyHROrAdmin } from '../core/middlewares/role.middleware';
import { updateApplicationStatus } from '../controllers/ats.controller';

const router = Router();

router.put('/:applicationId/status', authMiddleware, onlyHROrAdmin, updateApplicationStatus);

export default router;