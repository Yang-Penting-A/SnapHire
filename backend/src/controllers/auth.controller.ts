import { Request, Response } from 'express';
import { AuthRequest } from '../core/types/authRequest';
import { getUserById, getUserByEmail, updateUserPasswordAdmin } from '../services/supabase';

export async function login(req: AuthRequest, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const result = await getUserById(userId);

    if (!result.success || !result.data || result.data.length === 0) {
      console.warn('[LOGIN] User not found in database:', userId);
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const user = result.data[0];
    console.log(`[LOGIN] User: ${user.name} (${user.role})`);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('[LOGIN] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login verification failed'
    });
  }
}

export async function oauthCallback(req: AuthRequest, res: Response) {
  try {
    const userId = (req as any).user?.id;
    const userEmail = (req as any).user?.email;
    const { email, name, provider, provider_id } = req.body;

    // Check if user exists by email (simple approach)
    const userResult = await getUserByEmail(userEmail);

    if (!userResult.success || !userResult.data || userResult.data.length === 0) {
      return res.status(404).json({ status: 'error', message: `User dengan email ${userEmail} belum terdaftar. Silahkan hubungi admin untuk didaftarkan.` });
    }

    const userData = userResult.data[0];
    console.log(`[AUTH] OAuth: ${userData.name} (${userData.role})`);

    // CRITICAL: Validate role is only 'hr' or 'admin'
    const userRole = userData.role?.toLowerCase();
    if (!['hr', 'admin'].includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: `User dengan role '${userData.role}' tidak diizinkan login.`
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'OAuth login successful',
      data: {
        user_id: userData.user_id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        created_at: userData.created_at
      }
    });
  } catch (error: any) {
    console.error('[OAUTH CALLBACK] Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'OAuth callback failed'
    });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { email, newPassword } = req.body;

    // Validation
    if (!email || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password baru wajib diisi'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password minimal 8 karakter'
      });
    }

    // Check if user exists in database
    const userResult = await getUserByEmail(email.toLowerCase());

    if (!userResult.success || !userResult.data || userResult.data.length === 0) {
      console.warn('[RESET PASSWORD] User not found:', email);
      return res.status(404).json({ status: 'error', message: 'Email tidak ditemukan dalam sistem' });
    }

    const user = userResult.data[0];
    const userId = user.user_id;

    const updateResult = await updateUserPasswordAdmin(userId, newPassword);

    if (!updateResult.success) {
      console.error('[AUTH] Password update error:', updateResult.error);
      return res.status(500).json({ status: 'error', message: 'Gagal memperbarui password. Silahkan coba lagi.' });
    }

    console.log(`[AUTH] Password reset: ${email}`);
    res.status(200).json({
      status: 'success',
      message: 'Password berhasil diperbarui'
    });
  } catch (error: any) {
    console.error('[AUTH] Error: ' + error.message);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Terjadi kesalahan saat mereset password'
    });
  }
}