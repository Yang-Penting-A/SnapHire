import { Response } from 'express';
import { supabaseService } from '../services/supabase';
import { onlyHROrAdmin } from '../core/middlewares/role.middleware';
import { AuthRequest } from '../core/types/authRequest';
import { handleAtsAutomation } from '../services/ats.service';

// Valid status transitions
const VALID_STATUSES = ['Review AI', 'Shortlisted', 'Interview', 'Technical Test', 'Hired', 'Rejected'];

// Statuses that trigger ATS email notifications
const EMAIL_TRIGGER_STATUSES = {
  'Interview': 'interview_invitation',
  'Technical Test': 'technical_test_notification',
  'Hired': 'hired_notification',
  'Rejected': 'rejection_notification'
};

// Update application status with ATS automation
export async function updateApplicationStatus(req: AuthRequest, res: Response) {
  try {
    const { applicationId } = req.params;
    const { newStatus, interviewDate, interviewLocation } = req.body;

    if (!newStatus) {
      return res.status(400).json({
        success: false,
        error: 'newStatus is required'
      });
    }

    if (!VALID_STATUSES.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Fetch application with candidate and job details
    const appResult = await supabaseService.select('applications',
      { application_id: applicationId }
    );

    if (!appResult.success || !appResult.data || appResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    const application = appResult.data[0];

    // Fetch candidate details
    const candidateResult = await supabaseService.select('candidates',
      { candidate_id: application.candidate_id }
    );

    if (!candidateResult.success || !candidateResult.data || candidateResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Candidate not found'
      });
    }

    const candidate = candidateResult.data[0];

    // Fetch job details
    const jobResult = await supabaseService.select('jobs',
      { job_id: application.job_id }
    );

    if (!jobResult.success || !jobResult.data || jobResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const job = jobResult.data[0];

    // Update application status
    const updateResult = await supabaseService.update(
      'applications',
      { status_application: newStatus, updated_at: new Date() },
      'application_id',
      applicationId
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update application status'
      });
    }

    // Handle ATS automation
    if (Object.keys(EMAIL_TRIGGER_STATUSES).includes(newStatus)) {
      await handleAtsAutomation(
        newStatus,
        applicationId,
        candidate,
        job,
        application,
        { interviewDate, interviewLocation }
      );
    }

    res.json({
      success: true,
      message: `Status updated to ${newStatus}`,
      data: {
        application_id: applicationId,
        status_application: newStatus
      }
    });
  } catch (error) {
    console.error('[APPLICATIONS] Exception in update status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}