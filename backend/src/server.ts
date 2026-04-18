import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['*'],
  allowedHeaders: ['*'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to SnapHire API',
    version: '1.0.0',
  });
});

app.use(config.apiPrefix, routes);

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
