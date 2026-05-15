import { supabase } from '../supabase';

interface JobMatchResult {
  found: boolean;
  job_id?: string;
  job_title?: string;
  error?: string;
}

// Parse job position from email subject: [Position Name] - Candidate Name
export const extractPositionFromSubject = (subject: string): string | null => {
  const match = subject.match(/\[([^\]]+)\]/);
  return match ? match[1].trim() : null;
};

// Find matching job in database by position name
export const findJobByPosition = async (positionName: string): Promise<JobMatchResult> => {
  try {
    if (!positionName || positionName.length === 0) {
      return {
        found: false,
        error: 'Position name is empty',
      };
    }

    const { data: jobs, error } = await supabase.from('jobs').select('*');

    if (error) {
      return {
        found: false,
        error: `Database error: ${error.message}`,
      };
    }

    if (!jobs || jobs.length === 0) {
      return {
        found: false,
        error: 'No jobs available',
      };
    }

    // Try exact match first (case-insensitive)
    const positionLower = positionName.toLowerCase();
    let matchedJob = jobs.find((job: any) => job.title && job.title.toLowerCase() === positionLower);

    // If no exact match, try partial match
    if (!matchedJob) {
      matchedJob = jobs.find((job: any) => job.title && job.title.toLowerCase().includes(positionLower));
    }

    // If still no match, try reverse (job title contains position word)
    if (!matchedJob) {
      const words = positionName.toLowerCase().split(' ');
      matchedJob = jobs.find((job: any) => {
        if (!job.title) return false;
        const jobTitle = job.title.toLowerCase();
        return words.some((word) => jobTitle.includes(word));
      });
    }

    if (matchedJob) {
      return {
        found: true,
        job_id: matchedJob.job_id,
        job_title: matchedJob.title,
      };
    }

    return {
      found: false,
      error: `No matching job found for position: "${positionName}"`,
    };
  } catch (error: any) {
    return {
      found: false,
      error: error.message,
    };
  }
};

// Extract job ID from email subject
export const extractJobIdFromSubject = async (subject: string): Promise<JobMatchResult> => {
  const positionName = extractPositionFromSubject(subject);

  if (!positionName) {
    return {
      found: false,
      error: 'Could not parse position from subject',
    };
  }

  return findJobByPosition(positionName);
};
