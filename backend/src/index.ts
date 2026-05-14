import app from './server';
import { config } from './config/config';
import EmailService from './services/email/imap';

const PORT = config.port;

async function testEmailService(): Promise<void> {
  try {
    const emailService = new EmailService();
    await emailService.connect();
    await emailService.fetchUnreadEmails();
    await emailService.disconnect();
  } catch (error) {
    console.error(
      'Email service test failed:',
      error instanceof Error ? error.message : error
    );
  }
}

async function startServer(): Promise<void> {
  try {
    testEmailService();

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

startServer();

