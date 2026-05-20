import { Router } from 'express';
import { authMiddleware } from '../core/middlewares/auth.middleware';
import { login, oauthCallback, resetPassword } from '../controllers/auth.controller';

const router = Router();

// Login
router.post('/login', authMiddleware, login);

// OAuth Callback Handler for Google Login
router.post('/auth/oauth-callback', authMiddleware, oauthCallback);

// Reset Password - No auth required since user is not logged in
router.post('/auth/reset-password', resetPassword);

export default router;