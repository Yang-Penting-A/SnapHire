import { Router } from 'express';
import { onlyHROrAdmin } from '../core/middlewares/role.middleware';
import { updateApplicationStatus } from '../controllers/ats.controller';

const router = Router();

router.put('/:applicationId/status', onlyHROrAdmin, updateApplicationStatus);

export default router;