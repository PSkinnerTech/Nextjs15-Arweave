import { TurboFactory } from '@ardrive/turbo-sdk';
import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import { JWKInterface } from 'arweave/node/lib/wallet';

/**
 * Gets the content type of a file based on its extension
 * @param filePath Path to the file
 * @returns The MIME type of the file or application/octet-stream if unknown
 */
async function getContentType(filePath: string): Promise<string> {
  return mime.lookup(filePath) || 'application/octet-stream';
}

/**
 * Deploys a Next.js build to Arweave using Turbo
 * @param jwk The Arweave JWK wallet
 * @returns The manifest transaction ID
 */
export default async function TurboDeploy(jwk: JWKInterface): Promise<string> {
  const turbo = TurboFactory.authenticated({ privateKey: jwk });
  
  // For Next.js, the output is in the .next/static directory and out directory
  const deployFolder = './out';
  
  // Create a manifest for Arweave paths
  let manifest = {
    manifest: 'arweave/paths',
    version: '0.2.0',
    index: { path: '' },
    paths: {} as Record<string, { id: string }>
  };
  
  /**
   * Recursively processes files in a directory
   * @param dir Directory to process
   */
  async function processFiles(dir: string): Promise<void> {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const relativePath = path.relative(deployFolder, filePath)
        .split(path.sep)
        .join('/');
      
      if (fs.statSync(filePath).isDirectory()) {
        await processFiles(filePath);
        continue;
      }
      
      console.log(`Uploading: ${relativePath}`);
      
      const uploadResult = await turbo.uploadFile({
        fileStreamFactory: () => fs.createReadStream(filePath),
        fileSizeFactory: () => fs.statSync(filePath).size,
        dataItemOpts: {
          tags: [{ 
            name: 'Content-Type', 
            value: await getContentType(filePath) 
          }],
        },
      });
      
      manifest.paths[relativePath] = { id: uploadResult.id };
    }
  }
  
  // Check if the build directory exists
  if (!fs.existsSync(deployFolder)) {
    throw new Error('Out folder not found. Run "pnpm build" first.');
  }
  
  // Process all files in the build directory
  await processFiles(deployFolder);
  
  // Find the index.html file to set as the index in the manifest
  const indexPath = Object.keys(manifest.paths)
    .find(path => path === 'index.html' || path.match(/index\.[a-f0-9]+\.html$/i));
    
  if (indexPath) {
    manifest.index.path = indexPath;
  }
  
  // Upload the manifest
  const manifestResult = await turbo.uploadFile({
    fileStreamFactory: () => Buffer.from(JSON.stringify(manifest, null, 2)),
    fileSizeFactory: () => Buffer.from(JSON.stringify(manifest, null, 2)).length,
    dataItemOpts: {
      tags: [{
        name: 'Content-Type',
        value: 'application/x.arweave-manifest+json'
      }],
    },
  });
  
  return manifestResult.id;
} 