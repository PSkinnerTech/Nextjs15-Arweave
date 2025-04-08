import { NextResponse } from 'next/server';
import { ArweaveSigner, TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';
import path from 'path';

// Configure the route for static export
export const dynamic = 'force-dynamic';
export const revalidate = 0;


export const getTurboClient = async () => {
  const jwk = JSON.parse(process.env.TURBO_PRIVATE_KEY || '');
  if (!jwk) {
    throw new Error('TURBO_PRIVATE_KEY is not set');
  }
  const signer = new ArweaveSigner(jwk);
  return TurboFactory.authenticated({
    signer,
  });
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
    
    const turbo = await getTurboClient();
    const tmpDirId = `tmp/${Date.now()}`;
    const tmpDir = path.join(process.cwd(), tmpDirId);

    // create a tmp directory with all the files
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    // write all the files to the tmp directory
    for (const file of files) {
      const formFile = file as File;
      const filePath = path.join(tmpDir, formFile.name);
      const fileBuffer = Buffer.from(await formFile.arrayBuffer());
      fs.writeFileSync(filePath, fileBuffer);
    }

    // upload all the files to arweave and create a manifest
    const uploadFolder = await turbo.uploadFolder({
      folderPath: tmpDir,
      manifestOptions: {
        disableManifest: false,
        // any other manifest options
      }
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully to Arweave',
      txId: uploadFolder.manifestResponse?.id,
      url: `https://arweave.net/${uploadFolder.manifestResponse?.id}` ,
      files: files.length,
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
