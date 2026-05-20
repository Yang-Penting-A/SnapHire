import { Router } from 'express';
import { authMiddleware } from '../core/middlewares/auth.middleware';
import { onlyHROrAdmin } from '../core/middlewares/role.middleware';
import { getCurrentUser, submitApplication } from '../controllers/users.controller';

const router = Router();

router.get('/me', authMiddleware, getCurrentUser);

router.post('/applications', authMiddleware, onlyHROrAdmin, submitApplication);

export default router;