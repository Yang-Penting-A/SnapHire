import EmailService from './imap';
import EmailParser from './parser';
import CVUploadManager from './uploadManager';
import { extractJobIdFromSubject } from './jobMatcher';

interface ProcessedEmail {
  id: string;
  sender: string;
  subject: string;
  receivedDate: Date;
  folder: string;
  attachmentPath?: string;
}

interface FailedEmailEntry {
  retryCount: number;
  lastError: string;
  lastRetryTime: Date;
}

class EmailPollingService {
  private emailService: EmailService | null = null;
  private emailParser: EmailParser | null = null;
  private uploadManager: CVUploadManager | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private isPolling = false;
  private isPollingCycleActive = false;  
  private pollingIntervalMs = 20000;
  private maxRetries = 3;  
  
  private processedEmailIds = new Set<string>();  // Successfully processed
  private processingEmailIds = new Set<string>();  // Currently processing (prevent concurrent)
  private failedEmailIds = new Map<string, FailedEmailEntry>();  // Failed emails with retry count
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
      console.log(`Max retries per failed email: ${this.maxRetries}`);
      
      this.emailService = new EmailService();
      this.emailParser = new EmailParser();
      this.uploadManager = new CVUploadManager();
      await this.emailService.connect();
      
      this.isPolling = true;
      console.log('Email polling started (cycle: 15 seconds)');
      console.log('Monitoring: INBOX and [Gmail]/Spam folders');
      console.log('[POLLING] Sequential polling enabled - cycles will not overlap\n');

      // Start polling using recursive setTimeout (prevents overlapping cycles)
      this.scheduleNextPollingCycle();

      // Do initial check immediately
      await this.checkAllMailboxes();
    } catch (error) {
      console.error('Failed to start email polling:', error);
      this.isPolling = false;
      throw error;
    }
  }

  private scheduleNextPollingCycle(): void {
    if (!this.isPolling) {
      return;
    }

    // Schedule next cycle AFTER the polling interval has passed
    this.pollingTimer = setTimeout(() => {
      this.checkAllMailboxes().catch(error => {
        console.error('[ERROR] Unhandled error during polling cycle:', error);
      }).finally(() => {
        // Always schedule the next cycle, even if current one failed
        this.scheduleNextPollingCycle();
      });
    }, this.pollingIntervalMs);
  }

  async stopPolling(): Promise<void> {
    if (!this.isPolling) {
      console.log('Email polling is not running');
      return;
    }

    try {
      console.log('Stopping email polling service...');
      
      if (this.pollingTimer) {
        clearTimeout(this.pollingTimer);
        this.pollingTimer = null;
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

    // Prevent overlapping polling cycles
    if (this.isPollingCycleActive) {
      console.log('[POLLING-LOCK] ⚠ Polling cycle already active, skipping this cycle');
      return;
    }

    this.isPollingCycleActive = true;
    console.log('\n[POLLING-CYCLE-START] Checking mailboxes for new emails...');

    try {
      // Check INBOX
      await this.checkMailbox('INBOX');
      
      // Check Spam folder
      await this.checkMailbox('[Gmail]/Spam');
    } catch (error) {
      console.error('[ERROR] Error during polling cycle:', error);
    } finally {
      console.log('[POLLING-CYCLE-END]\n');
      this.isPollingCycleActive = false;
    }
  }

  private async checkMailbox(folderName: string): Promise<void> {
    if (!this.emailService || !this.isPolling) {
      return;
    }

    try {
      console.log(`\n[MAILBOX] Checking ${folderName}...`);

      const emails = await this.emailService.fetchUnreadEmailsFromMailbox(folderName);

      if (emails.length === 0) {
        console.log(`[MAILBOX] No unread emails in ${folderName}`);
        return;
      }

      console.log(`[MAILBOX] Found ${emails.length} unread email(s)`);

      for (const email of emails) {
        // Check if email was already SUCCESSFULLY processed
        if (this.processedEmailIds.has(email.id)) {
          console.log(`[SKIP] Already processed: ${email.subject}`);
          continue;
        }

        // Check if email is CURRENTLY BEING PROCESSED 
        if (this.processingEmailIds.has(email.id)) {
          console.log(`[SKIP] Currently processing: ${email.subject}`);
          continue;
        }

        // Check if email has PERMANENTLY FAILED 
        if (this.failedEmailIds.has(email.id)) {
          const failedEntry = this.failedEmailIds.get(email.id)!;
          if (failedEntry.retryCount >= this.maxRetries) {
            console.log(`[SKIP] Max retries (${this.maxRetries}) exceeded: ${email.subject}`);
            console.log(`       Last error: ${failedEntry.lastError}`);
            continue;
          }
        }

        console.log(`\n[DETECTED] New email from ${folderName}:`);
        console.log(`[DETECTED]   From: ${email.sender}`);
        console.log(`[DETECTED]   Subject: ${email.subject}`);
        console.log(`[DETECTED]   Date: ${email.receivedDate.toLocaleString()}`);

        // Mark as PROCESSING to prevent concurrent handling
        this.processingEmailIds.add(email.id);
        console.log(`[PROCESSING] Added to processing queue`);

        try {
          await this.processEmail(email, folderName);
        } catch (err) {
          console.error(`[ERROR] Exception in processEmail:`, err);
          // Track this failure for retry management
          this.recordFailedEmail(email.id, String(err));
        } finally {
          // Always remove from processing set when done (success or failure)
          this.processingEmailIds.delete(email.id);
        }

        // Mark as read only if not in DEV_MODE
        if (!this.devMode) {
          try {
            const messageIdStr = email.id.split(':')[1];
            const messageId = parseInt(messageIdStr, 10);
            const markedAsRead = await this.emailService.markEmailAsRead(messageId, folderName);

            if (markedAsRead) {
              console.log(`[READ] Email marked as read`);
            } else {
              console.warn(`[READ] Email could not be marked as read`);
            }
          } catch (err) {
            console.error(`[ERROR] Failed to mark email ${email.id} as read:`, err);
          }
        } else {
          console.log(`[READ] Email NOT marked as read (DEV_MODE=true)`);
        }
      }
    } catch (error) {
      console.error(`[ERROR] Error checking ${folderName}:`, error);
    }
  }

  private async processEmail(email: any, folderName: string): Promise<void> {
    if (!this.emailService || !this.emailParser || !this.uploadManager) {
      return;
    }

    try {
      const messageIdStr = email.id.split(':')[1];
      const messageId = parseInt(messageIdStr, 10);
      
      console.log(`[PROCESS] Processing email #${messageId}`);

      // Extract job ID from email subject
      let jobId: string | undefined;
      const jobMatch = await extractJobIdFromSubject(email.subject);
      
      if (jobMatch.found && jobMatch.job_id) {
        jobId = jobMatch.job_id;
        console.log(`[JOB-MATCH] ✓ Matched: ${jobMatch.job_title} (${jobId})`);
      } else {
        console.log(`[JOB-MATCH] ✗ Could not match job from subject`);
        // Not finding a job match is not fatal 
        return;
      }

      const emailRaw = await this.emailService.fetchEmailRaw(messageId, folderName);

      if (!emailRaw) {
        console.log(`[FETCH] ✗ Could not fetch raw email`);
        // Fetch failure might be temporary, allow retry
        return;
      }

      const attachment = await this.emailParser.extractAttachment(emailRaw);

      if (!attachment) {
        console.log(`[ATTACHMENT] ✗ No valid attachments found`);
        return;
      }

      console.log(`[ATTACHMENT] ✓ Found: ${attachment.filename} (${attachment.size} bytes)`);
      console.log(`[BUFFER] Attachment buffer received: ${attachment.content.length} bytes`);

      // Upload to Azure and trigger existing SnapHire pipeline
      console.log(`[UPLOAD] Starting memory-based CV processing...`);
      
      const uploadResult = await this.uploadManager.uploadCVFromBuffer(
        attachment.content,
        attachment.filename,
        jobId
      );

      if (uploadResult.success) {
        console.log(`[SUCCESS] ✓ CV processing completed`);
        console.log(`[SUCCESS]   Candidate: ${uploadResult.candidate_name}`);
        console.log(`[SUCCESS]   Score: ${uploadResult.score}`);
        
        // ONLY mark as processed after successful processing
        this.processedEmailIds.add(email.id);
        console.log(`[SUCCESS] ✓ Marked as processed (will skip on future cycles)`);
        
        // Remove from failed tracking if previously failed
        if (this.failedEmailIds.has(email.id)) {
          this.failedEmailIds.delete(email.id);
          console.log(`[SUCCESS] ✓ Removed from failed emails list`);
        }
      } else {
        console.log(`[RETRY] ✗ CV processing failed: ${uploadResult.error}`);
        console.log(`[RETRY]   Email will be retried in next polling cycle`);
      }
    } catch (error) {
      console.error(`[ERROR] Exception in processEmail:`, error);
      throw error; // Re-throw to be caught by checkMailbox's catch block
    }
  }

  private recordFailedEmail(emailId: string, errorMessage: string): void {
    const existingEntry = this.failedEmailIds.get(emailId);
    const retryCount = existingEntry ? existingEntry.retryCount + 1 : 1;
    
    this.failedEmailIds.set(emailId, {
      retryCount,
      lastError: errorMessage.substring(0, 100), // Limit error message length
      lastRetryTime: new Date()
    });

    console.log(`[FAIL-TRACK] Retry count: ${retryCount}/${this.maxRetries}`);
    
    if (retryCount >= this.maxRetries) {
      console.log(`[FAIL-TRACK] ⚠ Email will NOT be retried after this cycle (max retries exceeded)`);
    }
  }

  isRunning(): boolean {
    return this.isPolling;
  }

  /**
   * Get statistics about processed emails
   * Useful for monitoring and debugging
   */
  getProcessedStats(): {
    isRunning: boolean;
    isPollingCycleActive: boolean;
    totalProcessedSuccessfully: number;
    totalCurrentlyProcessing: number;
    totalFailedEmails: number;
    failedEmailDetails: Array<{emailId: string; retryCount: number; lastError: string}>;
  } {
    return {
      isRunning: this.isPolling,
      isPollingCycleActive: this.isPollingCycleActive,
      totalProcessedSuccessfully: this.processedEmailIds.size,
      totalCurrentlyProcessing: this.processingEmailIds.size,
      totalFailedEmails: this.failedEmailIds.size,
      failedEmailDetails: Array.from(this.failedEmailIds.entries()).map(([id, entry]) => ({
        emailId: id,
        retryCount: entry.retryCount,
        lastError: entry.lastError
      }))
    };
  }
}

export default EmailPollingService;
