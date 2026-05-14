import * as path from 'path';

interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

interface AttachmentData {
  filename: string;
  content: Buffer;
  size: number;
  mimetype?: string;
}

class AttachmentValidator {
  // Allowed file extensions
  private allowedExtensions = ['.pdf', '.docx'];

  // Allowed MIME types
  private allowedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Maximum file size: 5MB
  private maxFileSize = 5 * 1024 * 1024; // 5MB in bytes

  // Validate attachment before processing
  async validateAttachment(attachment: AttachmentData): Promise<ValidationResult> {
    try {
      console.log('Validation started for attachment...');

      // Check if filename exists
      if (!attachment.filename) {
        console.log('Validation failed: No filename provided');
        return {
          isValid: false,
          error: 'Attachment has no filename',
        };
      }

      // Check file extension
      const ext = path.extname(attachment.filename).toLowerCase();
      if (!this.allowedExtensions.includes(ext)) {
        console.log(`Validation failed: Invalid file type - ${ext}`);
        return {
          isValid: false,
          error: `Invalid file type. Only ${this.allowedExtensions.join(', ')} are allowed`,
        };
      }

      // Check file size
      if (attachment.size > this.maxFileSize) {
        const sizeMB = (attachment.size / (1024 * 1024)).toFixed(2);
        const maxMB = (this.maxFileSize / (1024 * 1024)).toFixed(1);
        console.log(`Validation failed: File too large - ${sizeMB}MB (max ${maxMB}MB)`);
        return {
          isValid: false,
          error: `File size ${sizeMB}MB exceeds maximum ${maxMB}MB`,
        };
      }

      // Check MIME type if provided
      if (attachment.mimetype && !this.allowedMimeTypes.includes(attachment.mimetype)) {
        console.log(`Validation failed: Invalid MIME type - ${attachment.mimetype}`);
        return {
          isValid: false,
          error: `Invalid MIME type. Only PDF and DOCX files are allowed`,
        };
      }

      // Check content buffer exists
      if (!attachment.content || attachment.content.length === 0) {
        console.log('Validation failed: Empty file content');
        return {
          isValid: false,
          error: 'File content is empty',
        };
      }

      // Sanitize filename
      const sanitized = this.sanitizeFilename(attachment.filename);

      console.log('Validation passed');
      return {
        isValid: true,
        sanitizedFilename: sanitized,
      };
    } catch (error) {
      console.error('Error during validation:', error);
      return {
        isValid: false,
        error: 'Validation process failed',
      };
    }
  }

  // Sanitize filename to prevent path traversal and special characters
  private sanitizeFilename(filename: string): string {
    // Remove directory paths
    let sanitized = path.basename(filename);

    // Remove special characters, keep only alphanumeric, dots, hyphens, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    // Remove multiple consecutive dots (prevent directory traversal)
    sanitized = sanitized.replace(/\.{2,}/g, '_');

    // Remove leading/trailing dots
    sanitized = sanitized.replace(/^\.+|\.+$/g, '');

    // Ensure filename is not empty
    if (!sanitized) {
      sanitized = 'attachment';
    }

    return sanitized;
  }

  // Check if file extension is allowed
  isAllowedExtension(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    return this.allowedExtensions.includes(ext);
  }

  // Check if MIME type is allowed
  isAllowedMimeType(mimetype: string): boolean {
    return this.allowedMimeTypes.includes(mimetype);
  }

  // Get max file size in MB
  getMaxFileSizeMB(): number {
    return this.maxFileSize / (1024 * 1024);
  }

  // Get allowed extensions list
  getAllowedExtensions(): string[] {
    return [...this.allowedExtensions];
  }

  // Get allowed MIME types list
  getAllowedMimeTypes(): string[] {
    return [...this.allowedMimeTypes];
  }
}

export default AttachmentValidator;
export { ValidationResult, AttachmentData };
