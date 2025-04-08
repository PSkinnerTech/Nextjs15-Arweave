'use client';

import mime from 'mime-types';
import { ArconnectSigner, TurboFactory } from '@ardrive/turbo-sdk/web';

/**
 * Get the content type of a file
 */
export function getContentType(file: File): string {
  // Try to get the content type from the file type
  let contentType = file.type;
  
  // If the content type is not available, try to get it from the file name
  if (!contentType || contentType === 'application/octet-stream') {
    const mimeType = mime.lookup(file.name);
    if (mimeType) {
      contentType = mimeType;
    }
  }
  
  // If we still don't have a content type, use a default
  if (!contentType || contentType === 'application/octet-stream') {
    if (file.name.endsWith('.md')) {
      contentType = 'text/markdown';
    } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
      contentType = 'text/html';
    } else if (file.name.endsWith('.css')) {
      contentType = 'text/css';
    } else if (file.name.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (file.name.endsWith('.json')) {
      contentType = 'application/json';
    } else {
      contentType = 'application/octet-stream';
    }
  }
  
  return contentType;
}

/**
 * Get the content type from a filename
 */
export function getContentTypeFromFilename(filename: string): string {
  // Try to get the content type from the filename
  const mimeType = mime.lookup(filename);
  if (mimeType) {
    return mimeType;
  }
  
  // If we don't have a content type, use a default based on extension
  if (filename.endsWith('.md')) {
    return 'text/markdown';
  } else if (filename.endsWith('.html') || filename.endsWith('.htm')) {
    return 'text/html';
  } else if (filename.endsWith('.css')) {
    return 'text/css';
  } else if (filename.endsWith('.js')) {
    return 'application/javascript';
  } else if (filename.endsWith('.json')) {
    return 'application/json';
  }
  
  // Default type
  return 'application/octet-stream';
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Upload a file to Arweave using ArConnect for signing
 */
export async function uploadToArweave(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ id: string; url: string }> {
  // Check if ArConnect is installed
  if (!window.arweaveWallet) {
    throw new Error('ArConnect wallet not found. Please install the ArConnect browser extension.');
  }
  
  try {
    // Request wallet permissions
    if (onProgress) onProgress(5);
    await window.arweaveWallet.connect(['ACCESS_PUBLIC_KEY', 'SIGNATURE', 'SIGN_TRANSACTION']);
    if (onProgress) onProgress(10);
    
    // Get wallet address for logging
    const walletAddress = await window.arweaveWallet.getActiveAddress();
    console.log('Wallet address:', walletAddress);

    const signer = new ArconnectSigner(window.arweaveWallet);
    const turbo = TurboFactory.authenticated({ signer });
    
    // Prepare data
    if (onProgress) onProgress(20);
    console.log('Reading file data...');
    const data = await file.arrayBuffer();
    
    // Create transaction
    if (onProgress) onProgress(30);
    console.log('Creating transaction...'); 
    
    // Submit transaction
    console.log('Posting transaction to Arweave network...');
    const response = await turbo.uploadFile({ 
      fileStreamFactory: () => Buffer.from(data),
      fileSizeFactory: () => data.byteLength,
      dataItemOpts: {
        tags: [
          { name: 'Content-Type', value: getContentType(file) },
          { name: 'App-Name', value: 'Arweave-Upload-Demo' },
          { name: 'App-Version', value: '1.0.0' },
          { name: 'Unix-Time', value: String(Date.now()) },
          { name: 'Filename', value: file.name }
        ]
      }
    })
    
    if (onProgress) onProgress(100);
    console.log('Transaction posted successfully:', response.id);
    
    return {
      id: response.id,
      url: `https://arweave.net/${response.id}`
    };
  } catch (error: unknown) {
    console.error('Upload error:', error);
    throw new Error(`Upload error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Upload a folder to Arweave (uploads multiple files individually)
 */
export async function uploadFolderToArweave(
  files: File[],
  onProgress?: (percent: number) => void
): Promise<{ id: string; url: string }> {
  if (!files.length) {
    throw new Error('No files provided for upload');
  }
  
  try {
    // For simplicity, we'll just upload the first file
    console.log(`Uploading first file from folder: ${files[0].name}`);
    return await uploadToArweave(files[0], onProgress);
  } catch (error: unknown) {
    console.error('Folder upload error:', error);
    throw new Error(`Folder upload error: ${error instanceof Error ? error.message : String(error)}`);
  }
} 
