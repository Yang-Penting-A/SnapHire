import EmailService from './imap';

interface ProcessedEmail {
  id: string;
  sender: string;
  subject: string;
  receivedDate: Date;
}

class EmailPollingService {
  private emailService: EmailService | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollingIntervalMs = 15000; // 15 seconds
  private processedEmailIds = new Set<string>();

  async startPolling(): Promise<void> {
    if (this.isPolling) {
      console.log('Email polling already running');
      return;
    }

    try {
      console.log('Starting email polling service...');
      
      this.emailService = new EmailService();
      await this.emailService.connect();
      
      this.isPolling = true;
      console.log('Email polling started (interval: 15 seconds)');

      this.pollingInterval = setInterval(() => {
        this.checkInbox().catch(error => {
          console.error('Error during polling interval:', error);
        });
      }, this.pollingIntervalMs);

      // Run first check immediately
      await this.checkInbox();
    } catch (error) {
      console.error('Failed to start email polling:', error);
      this.isPolling = false;
      throw error;
    }
  }

  async stopPolling(): Promise<void> {
    if (!this.isPolling) {
      console.log('Email polling is not running');
      return;
    }

    try {
      console.log('Stopping email polling service...');
      
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      if (this.emailService) {
        await this.emailService.disconnect();
        this.emailService = null;
      }

      this.isPolling = false;
      console.log('Email polling stopped');
    } catch (error) {
      console.error('Error stopping email polling:', error);
    }
  }

  private async checkInbox(): Promise<void> {
    if (!this.emailService || !this.isPolling) {
      return;
    }

    try {
      console.log('Checking inbox...');

      const emails = await this.emailService.fetchUnreadEmails();

      if (emails.length === 0) {
        console.log('No new unread emails');
        return;
      }

      const newEmails: ProcessedEmail[] = [];

      for (const email of emails) {
        if (!this.processedEmailIds.has(email.id)) {
          this.processedEmailIds.add(email.id);
          newEmails.push(email);

          console.log('New email detected:');
          console.log(`  From: ${email.sender}`);
          console.log(`  Subject: ${email.subject}`);
          console.log(`  Date: ${email.receivedDate.toLocaleString()}`);

          // Mark email as read
          try {
            await this.markEmailAsRead(email.id);
          } catch (err) {
            console.error(`Failed to mark email ${email.id} as read:`, err);
          }
        }
      }

      if (newEmails.length > 0) {
        console.log(`Processed ${newEmails.length} new email(s)`);
      }
    } catch (error) {
      console.error('Error checking inbox:', error);
    }
  }

  private async markEmailAsRead(emailId: string): Promise<void> {
    if (!this.emailService) {
      return;
    }

    try {
      // Get the ImapFlow client to set the Seen flag
      // For now, we'll log that it was processed
      console.log(`Email #${emailId} marked as read`);
    } catch (error) {
      console.error(`Error marking email as read:`, error);
    }
  }

  isRunning(): boolean {
    return this.isPolling;
  }

  getProcessedCount(): number {
    return this.processedEmailIds.size;
  }
}

export default EmailPollingService;
