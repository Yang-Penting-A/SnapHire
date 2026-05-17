// Email Inbox & CV Ingestion Services
export { default as EmailService } from './imap';
export { default as EmailPollingService } from './poller';
export { default as EmailParser } from './parser';
export { default as AttachmentValidator } from './validator';
export { default as CVUploadManager } from './uploadManager';
export { extractJobIdFromSubject, extractPositionFromSubject, findJobByPosition } from './jobMatcher';
export { ExtractedAttachment } from './parser';
export { ValidationResult, AttachmentData } from './validator';
export { UploadResult } from './uploadManager';

// ATS Transactional Email Service (Resend)
export { default as ATSEmailService } from './sendEmail';

// Email Templates
export { generateInterviewInvitationHTML, InterviewInvitationData } from './templates';
