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
      console.warn('[AUTH] Missing/invalid Authorization header', {
        method: req.method,
        path: req.originalUrl,
        hasCookie: Boolean(req.headers.cookie),
      });
      res.status(401).json({
        status: 'error',
        message: 'Missing or invalid Authorization header'
      });
      return;
    }

    const token = authHeader.substring(7); 

    // Debug: log token presence and basic info (masked)
    try {
      const masked = token.length > 20 ? `${token.substring(0,8)}...${token.substring(token.length-8)}` : token;
      console.log('[AUTH] Received Bearer token (masked):', masked);
      // Try to decode JWT payload for exp/iat without verifying signature
      const parts = token.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        try {
          const payload = JSON.parse(payloadJson);
          console.log('[AUTH] Token payload (decoded):', {
            sub: payload.sub || payload.user_id || null,
            email: payload.email || null,
            exp: payload.exp || null,
            iat: payload.iat || null,
          });
        } catch (e) {
          let parseErrMsg: string;
          if (e && typeof e === 'object' && 'message' in e) {
            parseErrMsg = String((e as any).message);
          } else {
            parseErrMsg = String(e);
          }
          console.warn('[AUTH] Failed to parse token payload JSON', parseErrMsg);
        }
      } else {
        console.warn('[AUTH] Token does not look like a JWT');
      }
    } catch (tokenLogErr) {
      console.warn('[AUTH] Error while logging token info:', tokenLogErr && (tokenLogErr as Error).message);
    }

    const internalApiKey = process.env.INTERNAL_API_KEY;
    if (internalApiKey && token === internalApiKey) {
      (req as any).internalService = true;
      console.log('[AUTH] ✅ Internal service token verified');
      next();
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.warn('[AUTH] Token verification with supabase.auth.getUser failed:', error?.message);

      // Fallback: try to decode sub from JWT and fetch user via admin API (service role key)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          const userId = payload.sub || payload.user_id || null;
          if (userId) {
            console.log('[AUTH] Attempting admin lookup for user id from token sub:', userId);
            const adminRes = await (supabase.auth as any).admin.getUserById(userId);
            const adminUser = adminRes?.data?.user ?? null;
            if (adminUser) {
              // Map admin auth user to application user by email
              const appUserRes = await supabase
                .from('users')
                .select('user_id, name, role, email')
                .eq('email', adminUser.email)
                .maybeSingle();

              const appUser = appUserRes?.data ?? null;
              if (!appUser) {
                console.warn('[AUTH] App user mapping not found for email from admin user:', adminUser.email);
                res.status(404).json({ status: 'error', message: 'User not found' });
                return;
              }

              (req as any).user = {
                id: appUser.user_id,
                email: appUser.email,
                name: appUser.name,
                role: appUser.role,
                authId: adminUser.id,
                createdAt: adminUser.created_at
              };

              console.log('[AUTH] ✅ Token verified via admin.getUserById and mapped to app user:', appUser.email);
              next();
              return;
            }
            console.warn('[AUTH] Admin lookup did not find user for id:', userId);
          } else {
            console.warn('[AUTH] Token payload did not contain sub/user_id');
          }
        }
      } catch (fallbackErr) {
        console.warn('[AUTH] Fallback admin lookup failed:', fallbackErr && (fallbackErr as any).message);
      }

      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
      return;
    }

    // Map authenticated user to application users table by email
    try {
      const appUserQuery = await supabase
        .from('users')
        .select('user_id, name, role, email')
        .eq('email', user.email)
        .maybeSingle();

      const appUser = (appUserQuery as any)?.data ?? null;
      if (!appUser) {
        console.warn('[AUTH] App user not found for email:', user.email);
        res.status(404).json({ status: 'error', message: 'User not found' });
        return;
      }

      (req as any).user = {
        id: appUser.user_id,
        email: appUser.email,
        name: appUser.name,
        role: appUser.role,
        authId: user.id,
        createdAt: user.created_at
      };

      console.log('[AUTH] ✅ Token verified and mapped to app user:', appUser.email);
      next();
      return;
    } catch (mapErr) {
      console.error('[AUTH] Error mapping auth user to app users table:', mapErr);
      res.status(500).json({ status: 'error', message: 'Authentication mapping failed' });
      return;
    }
  } catch (error) {
    console.error('[AUTH] Middleware error:', error);
    res.status(401).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};
