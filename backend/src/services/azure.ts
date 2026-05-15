import { BlobServiceClient } from '@azure/storage-blob';
import { config } from '../config/config';

// Initialize Azure Blob Storage client
const connectionString = config.azure.connectionString;
const containerName = config.azure.containerCv;

if (!connectionString) {
  throw new Error('Missing Azure Storage connection string in environment variables');
}

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export const azureService = {
  // Get container client
  getContainerClient: () => containerClient,

  // Get blob service client
  getBlobServiceClient: () => blobServiceClient,

  // Upload file to Azure Blob Storage
  async uploadFile(fileName: string, fileContent: Buffer, contentType: string = 'application/octet-stream') {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      const uploadBlobResponse = await blockBlobClient.upload(fileContent, fileContent.length, {
        blobHTTPHeaders: { blobContentType: contentType },
      });
      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileName,
          url: blockBlobClient.url,
          requestId: uploadBlobResponse.requestId,
        },
      };
    } catch (error) {
      console.error('[AZURE] Upload error: ' + error);
      return { success: false, message: String(error) };
    }
  },

  // Download file from Azure Blob Storage
  async downloadFile(fileName: string) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      const downloadBlockBlobResponse = await blockBlobClient.download(0);
      const fileBuffer = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody!);
      return {
        success: true,
        message: 'File downloaded successfully',
        data: fileBuffer,
      };
    } catch (error) {
      console.error('[AZURE] Download error: ' + error);
      return { success: false, message: String(error) };
    }
  },

  // Delete file from Azure Blob Storage
  async deleteFile(fileName: string) {
    try {
      const blockBlobClient = containerClient.getBlockBlobClient(fileName);
      await blockBlobClient.delete();
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      console.error('[AZURE] Delete error: ' + error);
      return { success: false, message: String(error) };
    }
  },

  // List all files in container
  async listFiles() {
    try {
      const files: string[] = [];
      for await (const blob of containerClient.listBlobsFlat()) {
        files.push(blob.name);
      }
      return {
        success: true,
        message: 'Files listed successfully',
        data: files,
      };
    } catch (error) {
      console.error('[AZURE] List error: ' + error);
      return { success: false, message: String(error) };
    }
  },

  // Test connection to Azure Storage
  async testConnection() {
    try {
      const properties = await containerClient.getProperties();
      return {
        success: true,
        message: 'Azure Storage connection successful',
        data: properties,
      };
    } catch (error) {
      console.error('[AZURE] Connection error: ' + error);
      return { success: false, message: 'Failed to connect to Azure Storage' };
    }
  },

};

async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}
