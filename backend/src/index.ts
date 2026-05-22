import app from './app';
import { config, validateDeploymentConfig } from './config';
import EmailPollingService from './services/email/poller';
import sendRouter from './api/auth/send';

const PORT = config.port;

let emailPollingService: EmailPollingService | null = null;

async function startServer(): Promise<void> {
  try {
    validateDeploymentConfig();

    // Start email polling service (non-blocking)
    emailPollingService = new EmailPollingService();
    emailPollingService.startPolling().catch(error => {
      console.error('[POLLING] Start error: ' + error);
    });

    // Start Express server immediately
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Docs available at http://localhost:${PORT}${config.apiPrefix}`);
      console.log(`🔧 Environment: ${config.debug ? 'development' : 'production'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[SERVER] Shutting down gracefully...');
  
  if (emailPollingService) {
    await emailPollingService.stopPolling();
  }
  
  process.exit(0);
});

app.use('/api', sendRouter);

startServer();

