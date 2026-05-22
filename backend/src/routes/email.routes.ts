import { Router } from 'express';
import { onlyHROrAdmin } from '../core/middlewares/role.middleware';
import {
	sendInterviewInvitation,
	sendTechnicalTest,
	sendHiredNotification,
	sendRejection,
	confirmInterview,
} from '../controllers/email.controller';

const router = Router();

router.post('/send-interview-invitation', onlyHROrAdmin, sendInterviewInvitation);
router.post('/send-technical-test', onlyHROrAdmin, sendTechnicalTest);
router.post('/send-hired-notification', onlyHROrAdmin, sendHiredNotification);
router.post('/send-rejection', onlyHROrAdmin, sendRejection);
router.post('/confirm-interview', confirmInterview);

export default router;