import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';

// Initialize Supabase client with service role key 
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        status: 'error',
        message: 'Missing or invalid Authorization header'
      });
      return;
    }

    const token = authHeader.substring(7); 

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('[AUTH] Token verification failed:', error?.message);
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
      return;
    }

    (req as any).user = {
      id: user.id,
      email: user.email,
      createdAt: user.created_at
    };

    console.log('[AUTH] ✅ Token verified for user:', user.email);

    next();
  } catch (error) {
    console.error('[AUTH] Middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};
