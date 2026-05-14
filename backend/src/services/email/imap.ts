import { ImapFlow } from 'imapflow';

interface EmailMessage {
  id: string;
  sender: string;
  subject: string;
  receivedDate: Date;
}

class EmailService {
  private client: ImapFlow | null = null;
  private emailUser: string;
  private emailPassword: string;
  private imapHost: string;
  private imapPort: number;
  private imapSecure: boolean;

  constructor() {
    this.emailUser = process.env.EMAIL_USER || '';
    this.emailPassword = process.env.EMAIL_APP_PASSWORD || '';
    this.imapHost = process.env.IMAP_HOST || 'imap.gmail.com';
    this.imapPort = parseInt(process.env.IMAP_PORT || '993', 10);
    this.imapSecure = process.env.IMAP_SECURE === 'true';

    if (!this.emailUser || !this.emailPassword) {
      throw new Error('Missing EMAIL_USER or EMAIL_APP_PASSWORD in .env');
    }
  }

  async connect(): Promise<void> {
    try {
      console.log('Connecting to Gmail IMAP...');

      this.client = new ImapFlow({
        host: this.imapHost,
        port: this.imapPort,
        secure: this.imapSecure,
        auth: {
          user: this.emailUser,
          pass: this.emailPassword,
        },
        logger: false,
      });

      this.client.on('error', (err) => {
        console.error('IMAP Connection Error:', err.message);
      });

      this.client.on('close', () => {
        console.log('IMAP Connection Closed');
      });

      await this.client.connect();
      console.log('Successfully connected to Gmail IMAP');
    } catch (error) {
      console.error('Failed to connect to Gmail IMAP:', error);
      throw error;
    }
  }

  async fetchUnreadEmails(): Promise<EmailMessage[]> {
    return this.fetchUnreadEmailsFromMailbox('INBOX');
  }

  async fetchUnreadEmailsFromMailbox(folderName: string): Promise<EmailMessage[]> {
    if (!this.client) {
      throw new Error('IMAP client not connected');
    }

    try {
      console.log(`Fetching unread emails from ${folderName}...`);

      const mailbox = await this.client.mailboxOpen(folderName);
      console.log(`${folderName}: ${mailbox.exists} total messages`);

      const unreadSearch = await this.client.search({ seen: false });
      
      if (!unreadSearch || (typeof unreadSearch !== 'boolean' && unreadSearch.length === 0)) {
        console.log(`No unread emails in ${folderName}`);
        return [];
      }

      const emails: EmailMessage[] = [];

      for await (const message of this.client.fetch(unreadSearch, {
        envelope: true,
      })) {
        try {
          const email: EmailMessage = {
            id: `${folderName}:${message.seq}`,
            sender: message.envelope?.from?.[0]?.address || 'Unknown',
            subject: message.envelope?.subject || '(No Subject)',
            receivedDate: message.envelope?.date || new Date(),
          };

          emails.push(email);

          console.log(`\nEmail #${message.seq} from ${folderName}:`);
          console.log(`  From: ${email.sender}`);
          console.log(`  Subject: ${email.subject}`);
          console.log(`  Date: ${email.receivedDate.toLocaleString()}`);
        } catch (msgError) {
          console.error('Error processing message:', msgError);
        }
      }

      console.log(`\nSuccessfully fetched ${emails.length} unread emails from ${folderName}`);
      return emails;
    } catch (error) {
      console.error(`Error fetching unread emails from ${folderName}:`, error);
      return [];
    }
  }

  async fetchEmailRaw(messageId: number): Promise<Buffer | null> {
    if (!this.client) {
      throw new Error('IMAP client not connected');
    }

    try {
      const message = await this.client.download(messageId, '');
      const chunks: Buffer[] = [];

      for await (const chunk of message.content) {
        chunks.push(chunk as Buffer);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error(`Error fetching raw email ${messageId}:`, error);
      return null;
    }
  }

  async markEmailAsRead(messageId: number): Promise<void> {
    try {
      if (this.client) {
        // Flag email as seen
        await (this.client as any).messageUpdate(messageId, { flags: { add: ['\\Seen'] } });
        console.log(`Email #${messageId} marked as read`);
      }
    } catch (error) {
      console.error(`Error marking email ${messageId} as read:`, error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      console.log('Disconnecting from Gmail IMAP...');
      await this.client.logout();
      console.log('Successfully disconnected from Gmail IMAP');
    } catch (error) {
      console.error('Error during disconnect:', error);
    } finally {
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

export default EmailService;
