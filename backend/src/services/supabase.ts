import { createClient } from '@supabase/supabase-js';
import { config } from '../config/config';

// Initialize Supabase client
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.serviceRoleKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for common database operations
export const supabaseService = {
  serializeError(error: unknown) {
    if (error instanceof Error) {
      return {
        message: error.message,
        stack: error.stack,
      };
    }

    try {
      return {
        message: JSON.stringify(error, null, 2),
      };
    } catch {
      return {
        message: String(error),
      };
    }
  },

  // Get client instance
  getClient: () => supabase,

  // Test connection
  async testConnection() {
    try {
      const { data, error } = await (supabase.auth.admin.listUsers() as any);
      if (error) throw error;
      return { success: true, message: 'Supabase connection successful' };
    } catch (error) {
      console.error('[DB] Connection failed:', error);
      console.dir(error, { depth: null });
      return { success: false, message: 'Failed to connect to Supabase', details: supabaseService.serializeError(error) };
    }
  },

  // Select from table
  async select(table: string, filter?: Record<string, any>) {
    try {
      let query = supabase.from(table).select('*') as any;
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('[DB] Select error:', error);
      console.dir(error, { depth: null });
      return { success: false, message: supabaseService.serializeError(error).message, details: supabaseService.serializeError(error) };
    }
  },

  // Insert into table
  async insert(table: string, data: Record<string, any>) {
    try {
      const { data: insertedData, error } = await (supabase
        .from(table)
        .insert([data])
        .select() as any);
      if (error) throw error;
      return { success: true, data: insertedData };
    } catch (error) {
      console.error('[DB] Insert error:', error);
      console.dir(error, { depth: null });
      return { success: false, message: supabaseService.serializeError(error).message, details: supabaseService.serializeError(error) };
    }
  },

  // Update in table
  async update(table: string, data: Record<string, any>, key: string, value: any) {
    try {
      const { data: updatedData, error } = await (supabase
        .from(table)
        .update(data)
        .eq(key, value)
        .select() as any);
      if (error) throw error;
      return { success: true, data: updatedData };
    } catch (error) {
      console.error('[DB] Update error:', error);
      console.dir(error, { depth: null });
      return { success: false, message: supabaseService.serializeError(error).message, details: supabaseService.serializeError(error) };
    }
  },

  // Delete from table
  async delete(table: string, key: string, value: any) {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(key, value);
      if (error) throw error;
      return { success: true, message: 'Deleted successfully' };
    } catch (error) {
      console.error('[DB] Delete error:', error);
      console.dir(error, { depth: null });
      return { success: false, message: supabaseService.serializeError(error).message, details: supabaseService.serializeError(error) };
    }
  },
};

// --- Auth Service Functions (formerly auth.service.ts) ---

export async function getUserById(userId: string) {
  return await supabaseService.select('users', { user_id: userId });
}

export async function getUserByEmail(email: string) {
  return await supabaseService.select('users', { email });
}

export async function updateUserPasswordAdmin(userId: string, newPassword: string) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err };
  }
}
