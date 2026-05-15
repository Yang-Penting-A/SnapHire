import { simpleParser } from 'mailparser';
import { Readable } from 'stream';
import AttachmentValidator from './validator';

interface ExtractedAttachment {
  filename: string;
  content: Buffer;
  size: number;
}

class EmailParser {
  private validator: AttachmentValidator;

  constructor() {
    this.validator = new AttachmentValidator();
  }

  async extractAttachment(emailBuffer: Buffer): Promise<ExtractedAttachment | null> {
    try {
      const stream = Readable.from(emailBuffer);
      
      let foundAttachment: ExtractedAttachment | null = null;

      const mail = await simpleParser(stream);

      if (!mail.attachments || mail.attachments.length === 0) {
        console.log('[EMAIL-PARSER] No attachments found in email');
        return null;
      }

      for (const attachment of mail.attachments) {
        if (!attachment.filename) {
          console.log('[EMAIL-PARSER] Attachment without filename skipped');
          continue;
        }

        console.log(`[EMAIL-PARSER] Attachment detected: ${attachment.filename} (${attachment.size} bytes)`);

        // Prepare attachment data for validation
        const content = typeof attachment.content === 'string' 
          ? Buffer.from(attachment.content) 
          : attachment.content as Buffer;

        const attachmentData = {
          filename: attachment.filename,
          content: content,
          size: attachment.size,
          mimetype: attachment.contentType || undefined,
        };

        // Validate attachment
        const validationResult = await this.validator.validateAttachment(attachmentData);

        if (!validationResult.isValid) {
          console.log(`[EMAIL-PARSER] Attachment rejected: ${validationResult.error}`);
          continue;
        }

        console.log(`[EMAIL-PARSER] ✓ Attachment validated: ${attachment.filename}`);
        console.log(`[BUFFER] Attachment buffer ready in memory (${content.length} bytes)`);

        foundAttachment = {
          filename: validationResult.sanitizedFilename || attachment.filename,
          content: content,
          size: attachment.size,
        };

        console.log(`[EMAIL-PARSER] ✓ Attachment ready for processing (memory-based)`);
        break;
      }

      return foundAttachment;
    } catch (error) {
      console.error('[EMAIL-PARSER] Error extracting attachment:', error);
      return null;
    }
  }
}

export default EmailParser;
export { ExtractedAttachment };
