import axios from 'axios';
import { config } from '../../config/config';

const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, '').replace(/\/api$/, '');

interface UploadResult {
  success: boolean;
  blobUrl?: string;
  filename?: string;
  candidate_id?: string;
  candidate_name?: string;
  score?: number;
  error?: string;
}

class CVUploadManager {
  // Upload CV file from buffer to Azure Blob Storage and trigger CV processing via API
  async uploadCVFromBuffer(cvBuffer: Buffer, filename: string, jobId?: string): Promise<UploadResult> {
    try {
      console.log(`[BUFFER-UPLOAD] Starting CV processing from buffer`);
      console.log(`[BUFFER-UPLOAD] File: ${filename} (${cvBuffer.length} bytes)`);

      const internalApiKey = process.env.INTERNAL_API_KEY;
      if (!internalApiKey) {
        console.error('[BUFFER-UPLOAD] INTERNAL_API_KEY is not configured');
        return {
          success: false,
          error: 'Missing INTERNAL_API_KEY for internal CV upload authentication',
        };
      }

      if (!jobId) {
        console.log(`[BUFFER-UPLOAD] ✗ No job ID provided - CV processing skipped`);
        return {
          success: false,
          error: 'No job ID provided',
        };
      }

      if (!config.backendUrl) {
        console.error('[BUFFER-UPLOAD] BACKEND_URL is not configured');
        return {
          success: false,
          error: 'Missing BACKEND_URL for internal CV upload routing',
        };
      }

      const backendBaseUrl = normalizeBaseUrl(config.backendUrl);
      const uploadUrl = `${backendBaseUrl}${config.apiPrefix}/cv/upload`;

      console.log(`[BUFFER-UPLOAD] Job ID: ${jobId}`);
      console.log(`[BUFFER-UPLOAD] Calling: POST ${uploadUrl}`);
      
      const FormDataClass = require('form-data');
      const formData = new FormDataClass();
      formData.append('file', cvBuffer, filename);
      formData.append('job_id', jobId);

      console.log(`[BUFFER-UPLOAD] FormData prepared with file from memory buffer`);

      try {
        console.log(`[BUFFER-UPLOAD] Making HTTP POST request...`);
        const response = await axios.post(uploadUrl, formData, {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${internalApiKey}`,
          },
          timeout: 60000,
        });

        console.log(`[BUFFER-UPLOAD] ✓ Response received (HTTP ${response.status})`);

        if (response.data.status === 'success') {
          console.log(`[BUFFER-UPLOAD] ✓✓ CV PROCESSING SUCCESSFUL`);
          console.log(`[BUFFER-UPLOAD]   Candidate ID: ${response.data.candidate_id}`);
          console.log(`[BUFFER-UPLOAD]   Candidate: ${response.data.candidate_name}`);
          console.log(`[BUFFER-UPLOAD]   Match Score: ${response.data.score}%`);
          console.log(`[BUFFER-UPLOAD]   File URL: ${response.data.file_url}`);
          console.log(`[BUFFER-UPLOAD]   ✓ Memory-based processing completed (no temp files)`);

          return {
            success: true,
            blobUrl: response.data.file_url,
            filename: filename,
            candidate_id: response.data.candidate_id,
            candidate_name: response.data.candidate_name,
            score: response.data.score,
          };
        } else {
          console.error(`[BUFFER-UPLOAD] ✗ API returned error status`);
          console.error(`[BUFFER-UPLOAD] Message: ${response.data.message}`);
          return {
            success: false,
            error: response.data.message || 'Unknown error from API',
          };
        }
      } catch (apiError: any) {
        console.error(`[BUFFER-UPLOAD] ✗ API CALL ERROR`);
        console.error(`[BUFFER-UPLOAD] Error: ${apiError.message}`);
        
        if (apiError.response?.status) {
          console.error(`[BUFFER-UPLOAD] HTTP Status: ${apiError.response.status}`);
          console.error(`[BUFFER-UPLOAD] Response:`, apiError.response.data);
        }
        
        return {
          success: false,
          error: `API call failed: ${apiError.message}`,
        };
      }
    } catch (error: any) {
      console.error(`[BUFFER-UPLOAD] ✗ Error in buffer processing: ${error.message}`);
      return {
        success: false,
        error: `Buffer processing failed: ${error.message}`,
      };
    }
  }
}

export default CVUploadManager;
export { UploadResult };
