import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './core/errors/errorHandler';
import routes from './routes';

const app = express();

const corsOptions = {
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Debug: print CORS config at startup to help diagnose preflight/CORS issues
console.log('[CORS] Allowed origins:', config.corsOrigin);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to SnapHire API',
    version: '1.0.0',
  });
});

app.use(config.apiPrefix, routes);

if (config.apiPrefix === '/api') {
  app.use('/', routes);
}

// Error handling middleware
app.use(errorHandler);

// Not found handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

export default app;