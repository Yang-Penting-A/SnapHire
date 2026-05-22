import dotenv from 'dotenv';

dotenv.config();

const trimUrl = (value: string | undefined): string => value?.trim() || '';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'https://snaphire.up.railway.app',
];

const parseCorsOrigins = (value: string | undefined): string[] => {
  const envOrigins = value?.split(',').map(origin => origin.trim()).filter(Boolean) || [];
  return Array.from(new Set([...DEFAULT_CORS_ORIGINS, ...envOrigins]));
};

export const config = {
  debug: process.env.DEBUG === 'true',
  port: parseInt(process.env.PORT || '8000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  frontendUrl: trimUrl(process.env.FRONTEND_URL),
  backendUrl: trimUrl(process.env.BACKEND_URL),
  database: {
    url: process.env.DATABASE_URL || '',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerCv: process.env.AZURE_STORAGE_CONTAINER_CV || 'cvs',
  },
  email: {
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_APP_PASSWORD || '',
    imap: {
      host: process.env.IMAP_HOST || 'imap.gmail.com',
      port: parseInt(process.env.IMAP_PORT || '993', 10),
      secure: process.env.IMAP_SECURE === 'true',
    },
  },
};

const criticalEnvNames = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AZURE_STORAGE_CONNECTION_STRING',
  'EMAIL_USER',
  'EMAIL_APP_PASSWORD',
  'GEMINI_API_KEY',
  'INTERNAL_API_KEY',
  'FRONTEND_URL',
  'BACKEND_URL',
];

export function validateDeploymentConfig() {
  const missing = criticalEnvNames.filter(name => !process.env[name]?.trim());

  if (missing.length > 0) {
    console.warn(`[ENV] Missing critical environment variables: ${missing.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production') {
    const localOrigins = config.corsOrigin.filter(origin => /localhost|127\.0\.0\.1/i.test(origin));
    if (localOrigins.length > 0) {
      console.warn(`[ENV] CORS_ORIGIN still contains local origins in production: ${localOrigins.join(', ')}`);
    }

    if (!config.frontendUrl) {
      console.warn('[ENV] FRONTEND_URL is required for production email links');
    }

    if (!config.backendUrl) {
      console.warn('[ENV] BACKEND_URL is required for production internal links');
    }
  } else if (config.corsOrigin.length === 0) {
    console.warn('[ENV] CORS_ORIGIN is not configured; local development requests may be blocked');
  }

  return missing;
}
