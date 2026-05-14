import EmailService from './imap';
import EmailParser from './parser';

interface ProcessedEmail {
  id: string;
  sender: string;
  subject: string;
  receivedDate: Date;
  folder: string;
  attachmentPath?: string;
}

class EmailPollingService {
  private emailService: EmailService | null = null;
  private emailParser: EmailParser | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling = false;
  private pollingIntervalMs = 15000;
  private processedEmailIds = new Set<string>();
  private devMode: boolean;

  constructor() {
    this.devMode = process.env.DEV_MODE === 'true';
  }

  async startPolling(): Promise<void> {
    if (this.isPolling) {
      console.log('Email polling already running');
      return;
    }

    try {
      console.log('Starting email polling service...');
      console.log(`DEV_MODE: ${this.devMode ? 'ON (emails NOT marked as read)' : 'OFF (emails marked as read)'}`);
      
      this.emailService = new EmailService();
      this.emailParser = new EmailParser();
      await this.emailService.connect();
      
      this.isPolling = true;
      console.log('Email polling started (interval: 15 seconds)');
      console.log('Monitoring: INBOX and [Gmail]/Spam folders');

      this.pollingInterval = setInterval(() => {
        this.checkAllMailboxes().catch(error => {
          console.error('Error during polling interval:', error);
        });
      }, this.pollingIntervalMs);

      await this.checkAllMailboxes();
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

  private async checkAllMailboxes(): Promise<void> {
    if (!this.emailService || !this.isPolling) {
      return;
    }

    try {
      // Check INBOX
      await this.checkMailbox('INBOX');
      
      // Check Spam folder
      await this.checkMailbox('[Gmail]/Spam');
    } catch (error) {
      console.error('Error checking mailboxes:', error);
    }
  }

  private async checkMailbox(folderName: string): Promise<void> {
    if (!this.emailService || !this.isPolling) {
      return;
    }

    try {
      console.log(`\nChecking ${folderName}...`);

      const emails = await this.emailService.fetchUnreadEmailsFromMailbox(folderName);

      if (emails.length === 0) {
        console.log(`No new unread emails in ${folderName}`);
        return;
      }

      for (const email of emails) {
        if (!this.processedEmailIds.has(email.id)) {
          this.processedEmailIds.add(email.id);

          console.log(`New email detected from ${folderName}:`);
          console.log(`  From: ${email.sender}`);
          console.log(`  Subject: ${email.subject}`);
          console.log(`  Date: ${email.receivedDate.toLocaleString()}`);

          try {
            await this.processEmail(email, folderName);
          } catch (err) {
            console.error(`Failed to process email ${email.id}:`, err);
          }

          // Mark as read only if not in DEV_MODE
          if (!this.devMode) {
            try {
              const messageIdStr = email.id.split(':')[1];
              const messageId = parseInt(messageIdStr, 10);
              await this.emailService.markEmailAsRead(messageId);
            } catch (err) {
              console.error(`Failed to mark email ${email.id} as read:`, err);
            }
          } else {
            console.log(`Email ${email.id} NOT marked as read (DEV_MODE)`);
          }
        }
      }
    } catch (error) {
      console.error(`Error checking ${folderName}:`, error);
    }
  }

  private async processEmail(email: any, folderName: string): Promise<void> {
    if (!this.emailService || !this.emailParser) {
      return;
    }

    try {
      const messageIdStr = email.id.split(':')[1];
      const messageId = parseInt(messageIdStr, 10);
      
      console.log(`Processing email #${messageId} from ${folderName}...`);

      const emailRaw = await this.emailService.fetchEmailRaw(messageId);

      if (!emailRaw) {
        console.log(`Could not fetch raw email ${email.id}`);
        return;
      }

      const attachment = await this.emailParser.extractAttachment(emailRaw);

      if (attachment) {
        console.log(`Attachment detected: ${attachment.filename} (${attachment.size} bytes)`);
        console.log(`Path: ${attachment.filepath}`);
      } else {
        console.log(`No valid attachments found in email #${messageId}`);
      }
    } catch (error) {
      console.error(`Error processing email #${email.id}:`, error);
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
