import { simpleParser } from 'mailparser';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import AttachmentValidator from './validator';

interface ExtractedAttachment {
  filename: string;
  filepath: string;
  size: number;
}

const TEMP_DIR = path.join(process.cwd(), 'temp');

class EmailParser {
  private validator: AttachmentValidator;

  constructor() {
    this.validator = new AttachmentValidator();
    this.ensureTempDirectory();
  }

  private ensureTempDirectory(): void {
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const baseName = path.basename(originalName, ext);
    return `${baseName}_${timestamp}${ext}`;
  }

  async extractAttachment(emailBuffer: Buffer): Promise<ExtractedAttachment | null> {
    try {
      const stream = Readable.from(emailBuffer);
      
      let foundAttachment: ExtractedAttachment | null = null;

      const mail = await simpleParser(stream);

      if (!mail.attachments || mail.attachments.length === 0) {
        console.log('No attachments found in email');
        return null;
      }

      for (const attachment of mail.attachments) {
        if (!attachment.filename) {
          console.log('Attachment without filename skipped');
          continue;
        }

        console.log(`Attachment detected: ${attachment.filename} (${attachment.size} bytes)`);

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
          console.log(`Attachment rejected: ${validationResult.error}`);
          continue;
        }

        // Generate unique filename from validated sanitized filename
        const uniqueName = this.generateUniqueFilename(validationResult.sanitizedFilename || attachment.filename);
        const filepath = path.join(TEMP_DIR, uniqueName);

        console.log(`Saving validated file to: ${filepath}`);

        // Save validated file
        await fs.promises.writeFile(filepath, content);

        foundAttachment = {
          filename: uniqueName,
          filepath: filepath,
          size: attachment.size,
        };

        console.log(`File saved successfully: ${uniqueName}`);
        break;
      }

      return foundAttachment;
    } catch (error) {
      console.error('Error extracting attachment:', error);
      return null;
    }
  }

  async cleanup(filepath: string): Promise<void> {
    try {
      if (fs.existsSync(filepath)) {
        await fs.promises.unlink(filepath);
        console.log(`Temporary file deleted: ${filepath}`);
      }
    } catch (error) {
      console.error(`Error deleting file ${filepath}:`, error);
    }
  }

  async cleanupAll(): Promise<void> {
    try {
      if (!fs.existsSync(TEMP_DIR)) {
        return;
      }

      const files = await fs.promises.readdir(TEMP_DIR);
      
      for (const file of files) {
        const filepath = path.join(TEMP_DIR, file);
        await fs.promises.unlink(filepath);
      }

      console.log('All temporary files cleaned up');
    } catch (error) {
      console.error('Error cleaning up temporary files:', error);
    }
  }
}

export default EmailParser;
export { ExtractedAttachment };
