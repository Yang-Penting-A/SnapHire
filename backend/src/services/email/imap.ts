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

      this.client.on('error', (err: any) => {
        console.error('[IMAP] Connection error: ' + (err && (err.stack || err.message || err)));
      });

      this.client.on('close', () => {
        console.log('[IMAP] Connection closed');
      });

      await this.client.connect();
      console.log('[IMAP] Connected');
    } catch (error: any) {
      console.error('[IMAP] Connection failed: ', error && (error.stack || error.message || error));
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

    const doFetch = async () => {
      // Open mailbox in read-only mode to avoid modifying message flags during fetch
      console.log(`[IMAP] Opening mailbox ${folderName} in read-only mode (will not set \\Seen)`);
      const mailbox = await this.client!.mailboxOpen(folderName, { readOnly: true });
      const unreadSearch = await this.client!.search({ seen: false }, { uid: true });

      if (!unreadSearch || (typeof unreadSearch !== 'boolean' && unreadSearch.length === 0)) {
        return [] as EmailMessage[];
      }

      const emails: EmailMessage[] = [];

      for await (const message of this.client!.fetch(unreadSearch, {
        envelope: true,
      }, { uid: true })) {
        try {
          const email: EmailMessage = {
            id: `${folderName}:${message.uid}`,
            sender: message.envelope?.from?.[0]?.address || 'Unknown',
            subject: message.envelope?.subject || '(No Subject)',
            receivedDate: message.envelope?.date || new Date(),
          };

          emails.push(email);
        } catch (msgError: any) {
          console.error('[IMAP] Error parsing message: ', msgError && (msgError.stack || msgError.message || msgError));
        }
      }

      console.log('[IMAP] Fetched ' + emails.length + ' unread emails from ' + folderName);
      return emails;
    };

    try {
      return await doFetch();
    } catch (error: any) {
      console.error('[IMAP] Fetch failed: ', error && (error.stack || error.message || error));

      // Attempt a reconnect once and retry the fetch to recover transient connection issues
      try {
        console.log('[IMAP] Attempting reconnect due to fetch error...');
        await this.disconnect().catch(() => undefined);
        await this.connect();
        console.log('[IMAP] Reconnect successful, retrying fetch...');
        return await doFetch();
      } catch (retryErr: any) {
        console.error('[IMAP] Retry after reconnect failed: ', retryErr && (retryErr.stack || retryErr.message || retryErr));
        return [];
      }
    }
  }

  async fetchEmailRaw(messageId: number, folderName: string = 'INBOX'): Promise<Buffer | null> {
    if (!this.client) {
      throw new Error('IMAP client not connected');
    }

    const doFetchRaw = async () => {
      // Open mailbox in read-only mode to avoid changing \\Seen flag while downloading
      console.log(`[IMAP] Fetching email ${messageId} from ${folderName} without setting \\Seen`);
      await this.client!.mailboxOpen(folderName, { readOnly: true });

      const message = await this.client!.download(messageId, '', { uid: true });
      const chunks: Buffer[] = [];

      for await (const chunk of message.content) {
        chunks.push(chunk as Buffer);
      }

      return Buffer.concat(chunks);
    };

    try {
      return await doFetchRaw();
    } catch (error: any) {
      console.error('[IMAP] Failed to fetch raw email: ', error && (error.stack || error.message || error));

      // Try reconnect once and retry
      try {
        console.log('[IMAP] Attempting reconnect due to fetchRaw error...');
        await this.disconnect().catch(() => undefined);
        await this.connect();
        console.log('[IMAP] Reconnect successful, retrying fetchRaw...');
        return await doFetchRaw();
      } catch (retryErr: any) {
        console.error('[IMAP] Retry for fetchRaw failed: ', retryErr && (retryErr.stack || retryErr.message || retryErr));
        return null;
      }
    }
  }

  async markEmailAsRead(messageId: number, folderName: string = 'INBOX'): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      await this.client.mailboxOpen(folderName);

      const marked = await this.client.messageFlagsAdd(messageId, ['\\Seen'], { uid: true });

      if (!marked) {
        throw new Error('ImapFlow messageFlagsAdd returned false');
      }

      return true;
    } catch (error: any) {
      console.error('[IMAP] Failed to mark as read: ', error && (error.stack || error.message || error));
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.logout();
      console.log('[IMAP] Disconnected');
    } catch (error: any) {
      console.error('[IMAP] Disconnect error: ', error && (error.stack || error.message || error));
    } finally {
      this.client = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}

export default EmailService;
