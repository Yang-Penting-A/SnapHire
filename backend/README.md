# SnapHire Backend API

Express.js backend for SnapHire application.

## Setup

### Install dependencies
```bash
npm install
```

### Environment variables
Copy `.env.example` to `.env` and fill in the required values.

Required variables:

- `PORT` - server port, default `8000`
- `API_PREFIX` - API prefix, default `/api`
- `CORS_ORIGIN` - comma-separated allowed origins
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER_CV`
- `EMAIL_USER`, `EMAIL_APP_PASSWORD`
- `FRONTEND_URL`, `BACKEND_URL`
- `IMAP_HOST`, `IMAP_PORT`, `IMAP_SECURE`

See `.env.example` for the complete template.

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## API Documentation

- Base URL: `http://localhost:8000`
- API Prefix: `/api`
- Example health check: `GET http://localhost:8000/health`
- Most application routes are mounted under `http://localhost:8000/api`

### Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `POST /api/auth/send-credential` - Send HR credential email from admin flow
- `POST /api/auth/reset-password` - Reset password for an existing user

## Tech Stack

- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database
- **Azure Storage** - Blob storage for CVs
- **CORS** - Cross-origin resource sharing

## Notes

- The email sender and IMAP poller both use `EMAIL_USER` plus `EMAIL_APP_PASSWORD`.
- The admin HR registration flow sends credentials from the frontend after account creation.
