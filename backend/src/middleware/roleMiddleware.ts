import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';

// Initialize Supabase client
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey
);

export const requireRole = (allowedRoles: string[]) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        res.status(401).json({
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('role, name')
        .eq('user_id', userId)
        .maybeSingle(); 

      if (error || !userData) {
        console.warn('[ROLE] User not found in database:', userId);
        res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
        return;
      }

      const userRole = userData.role?.toLowerCase();

      const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());
      const hasPermission = normalizedAllowedRoles.includes(userRole);

      if (!hasPermission) {
        console.warn(
          `[ROLE] Access denied for user ${userData.name} (${userRole}). Required: ${allowedRoles.join(', ')}`
        );
        res.status(403).json({
          status: 'error',
          message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
        });
        return;
      }

      (req as any).user = {
        ...(req as any).user,
        role: userRole,
        name: userData.name
      };

      console.log(`[ROLE] ${userData.name} (${userRole}) authorized`);

      next();
    } catch (error) {
      console.error('[ROLE] Middleware error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Role verification failed'
      });
    }
  };
};

export const onlyAdmin = requireRole(['admin']);
export const onlyHR = requireRole(['hr']);
export const onlyApplicant = requireRole(['applicant']);
export const onlyHROrAdmin = requireRole(['hr', 'admin']);
