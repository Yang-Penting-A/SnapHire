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
        console.error('[IMAP] Connection error: ' + err.message);
      });

      this.client.on('close', () => {
        console.log('[IMAP] Connection closed');
      });

      await this.client.connect();
      console.log('[IMAP] Connected');
    } catch (error) {
      console.error('[IMAP] Connection failed: ' + error);
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
      const mailbox = await this.client.mailboxOpen(folderName);
      const unreadSearch = await this.client.search({ seen: false });
      
      if (!unreadSearch || (typeof unreadSearch !== 'boolean' && unreadSearch.length === 0)) {
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
        } catch (msgError) {
          console.error('[IMAP] Error parsing message: ' + msgError);
        }
      }

      console.log('[IMAP] Fetched ' + emails.length + ' unread emails from ' + folderName);
      return emails;
    } catch (error) {
      console.error('[IMAP] Fetch failed: ' + error);
      return [];
    }
  }

  async fetchEmailRaw(messageId: number, folderName: string = 'INBOX'): Promise<Buffer | null> {
    if (!this.client) {
      throw new Error('IMAP client not connected');
    }

    try {
      // Select the correct mailbox before downloading
      await this.client.mailboxOpen(folderName);

      const message = await this.client.download(messageId, '');
      const chunks: Buffer[] = [];

      for await (const chunk of message.content) {
        chunks.push(chunk as Buffer);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      console.error('[IMAP] Failed to fetch raw email: ' + error);
      return null;
    }
  }

  async markEmailAsRead(messageId: number): Promise<void> {
    try {
      if (this.client) {
        await (this.client as any).messageUpdate(messageId, { flags: { add: ['\\Seen'] } });
      }
    } catch (error) {
      console.error('[IMAP] Failed to mark as read: ' + error);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.logout();
      console.log('[IMAP] Disconnected');
    } catch (error) {
      console.error('[IMAP] Disconnect error: ' + error);
    } finally {
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

export default EmailService;
