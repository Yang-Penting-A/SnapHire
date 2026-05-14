import app from './server';
import { config } from './config/config';
import EmailPollingService from './services/email/poller';

const PORT = config.port;

let emailPollingService: EmailPollingService | null = null;

async function startServer(): Promise<void> {
  try {
    // Start email polling service
    emailPollingService = new EmailPollingService();
    await emailPollingService.startPolling();

    // Start Express server
    app.listen(PORT, () => {
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
  console.log('\nShutting down gracefully...');
  
  if (emailPollingService) {
    await emailPollingService.stopPolling();
  }
  
  process.exit(0);
});

startServer();

