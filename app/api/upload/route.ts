import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

// Configure the route for static export
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Generate a random transaction ID in the format of Arweave txids
function generateTxId() {
  return randomBytes(32).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 43);
}

export async function POST(request: Request) {
  try {
    // Check if request is multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Request must be multipart/form-data' }, 
        { status: 400 }
      );
    }

    // Get the form data
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' }, 
        { status: 400 }
      );
    }

    // Simulate processing and uploading each file
    console.log(`Processing ${files.length} files for upload to Arweave...`);
    
    // In a real implementation, you would:
    // 1. Import the Turbo SDK
    // 2. Initialize it with the wallet
    // 3. Upload each file
    // 4. Create a manifest
    // 5. Return the manifest transaction ID
    
    // For now, we'll simulate this with a delay and random IDs
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a random transaction ID
    const txId = generateTxId();
    const url = `https://arweave.net/${txId}`;
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully to Arweave',
      txId,
      url,
      files: files.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type
      }))
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Failed to upload files', details: String(error) }, 
      { status: 500 }
    );
  }
}

// Handle GET requests with an error
export async function GET() {
  return NextResponse.json(
    { error: 'POST method required' }, 
    { status: 405 }
  );
} 