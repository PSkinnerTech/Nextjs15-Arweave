# Next.js Arweave Upload Demo

This project demonstrates how to upload files to the Arweave permaweb directly from a browser using Next.js 15, ArConnect wallet, and arweave-js.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

To build the project, run:

```bash
pnpm build
# or
npm run build --no-lint
# or
yarn build --no-lint
```

## Client-Side Arweave Upload Implementation

This project features a fully client-side implementation for uploading files to the Arweave network directly from the browser without requiring a server component. Here's how it works:

### Upload Flow

1. **User connects wallet** - ArConnect browser extension is used for wallet connection
2. **User selects file(s)** - Via drag & drop or file picker
3. **Upload is initiated** - Client-side code handles the entire upload process
4. **Transaction is created** - Using arweave-js to create an Arweave transaction
5. **Transaction is signed** - Using the connected wallet via ArConnect
6. **Transaction is posted** - Directly to the Arweave network
7. **URL is generated** - For permanent access to the uploaded file

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │  ArConnect  │     │  arweave-js │     │   Arweave   │
│    Client   │     │    Wallet   │     │  Library    │     │   Network   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ Connect Wallet    │                   │                   │
       │───────────────────>                   │                   │
       │                   │ Authorize         │                   │
       │                   │<──────────────────│                   │
       │ Grant Permission  │                   │                   │
       │<───────────────────                   │                   │
       │                   │                   │                   │
       │ Select File       │                   │                   │
       │────┐              │                   │                   │
       │    │              │                   │                   │
       │<───┘              │                   │                   │
       │                   │                   │                   │
       │ Upload File       │                   │                   │
       │────────────────────────────────────────>                  │
       │                   │                   │ Create Transaction│
       │                   │                   │────┐              │
       │                   │                   │    │              │
       │                   │                   │<───┘              │
       │                   │                   │                   │
       │                   │ Request Signature │                   │
       │                   │<──────────────────│                   │
       │ Confirm Signature │                   │                   │
       │<───────────────────                   │                   │
       │ Approve           │                   │                   │
       │───────────────────>                   │                   │
       │                   │ Return Signature  │                   │
       │                   │──────────────────>│                   │
       │                   │                   │ Post Transaction  │
       │                   │                   │──────────────────>│
       │                   │                   │                   │
       │                   │                   │ Transaction ID    │
       │                   │                   │<──────────────────│
       │ Upload Complete   │                   │                   │
       │<─────────────────────────────────────────────────────────│
       │                   │                   │                   │
```

### Files Involved

#### Core Application Files

- `app/page.tsx` - Main entry point with routing setup
- `app/components/DashboardPage.tsx` - Main upload interface 
- `app/utils/turboClient.ts` - Utility functions for Arweave uploads
- `app/context/AuthContext.tsx` - Handles wallet connection state
- `app/utils/arweaveWallet.ts` - Wallet utilities

#### Upload Process Files

| File | Purpose |
|------|---------|
| **DashboardPage.tsx** | Provides the UI for file uploading; handles drag & drop, file selection, and displays upload progress |
| **turboClient.ts** | Contains core upload functions: `uploadToArweave()` and `uploadFolderToArweave()` |
| **AuthContext.tsx** | Manages wallet connection state using ArConnect |

### The Upload Implementation

The client-side upload process is implemented as follows:

#### 1. Setting up arweave-js

```typescript
// app/utils/turboClient.ts
import Arweave from 'arweave';

// Initialize Arweave client
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});
```

#### 2. File Upload Function

```typescript
// app/utils/turboClient.ts
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

    // Initialize Turbo SDK with ArConnect signer
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
```

#### 3. UI Implementation in DashboardPage.tsx

```typescript
// app/components/DashboardPage.tsx
const handleUpload = async () => {
  if (files.length === 0) {
    addTerminalMessage('No files selected for upload.', 'error');
    return;
  }
  
  if (walletStatus !== 'connected') {
    addTerminalMessage('Wallet not connected. Please connect your wallet to upload files.', 'error');
    return;
  }
  
  setUploadStatus('uploading');
  setTerminalMessages([]); // Clear previous messages
  addTerminalMessage('$ arweave deploy', 'command');
  addTerminalMessage('Preparing for Arweave upload...', 'info');
  addTerminalMessage('Using ArConnect for direct transaction signing', 'info');
  
  try {
    // Calculate total size for info
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    addTerminalMessage(`Total upload size: ${formatBytes(totalSize)}`, 'info');
    
    // Single file upload
    const file = files[0];
    addTerminalMessage(`Preparing file: ${file.name} (${formatBytes(file.size)})`, 'info');
    
    // Determine content type
    const contentType = getContentType(file);
    addTerminalMessage(`Content-Type detected: ${contentType}`, 'info');
    addTerminalMessage('Requesting ArConnect wallet permissions...', 'info');
    
    setUploadingFile(file.name);
    setProgressPercent(10);
    
    // Upload file directly from browser
    const result = await uploadToArweave(file, (percent) => {
      setProgressPercent(percent);
    });
    
    setUploadingFile(null);
    setProgressPercent(100);
    
    addTerminalMessage(`File uploaded successfully with TX ID: ${result.id}`, 'success');
    addTerminalMessage(`View your file at: ${result.url}`, 'success');
    
    setDeploymentUrl(result.url);
    setUploadStatus('success');
  } catch (error) {
    console.error('Upload error:', error);
    setUploadingFile(null);
    setProgressPercent(0);
    
    addTerminalMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error during upload'}`, 'error');
    addTerminalMessage('Upload failed. Please try again or check your wallet connection.', 'error');
    setUploadStatus('error');
  }
};
```

### Key Benefits of Client-Side Implementation

1. **No server required** - All uploads happen directly from the user's browser
2. **Lower infrastructure costs** - No need for server bandwidth or storage
3. **Better privacy** - Files go directly from user to Arweave
4. **Simplified architecture** - No need for API routes or server-side code
5. **Better user experience** - Real-time progress updates and feedback

### Technical Considerations

- **Wallet extension required** - Users must have ArConnect installed
- **AR tokens needed** - Users must have AR tokens to pay for storage
- **File size limitations** - Browser memory limits may apply to very large files
- **Progress tracking** - The implementation includes progress updates during upload

## Components Overview

### DashboardPage Component

The Dashboard page provides a complete UI for uploading files including:

- File drag & drop interface
- File selection via file picker
- Upload progress tracking with percentage
- Terminal-like interface for command feedback
- Deployment URL display after successful uploads

### TurboClient Utilities

The `turboClient.ts` utility provides several key functions:

- `getContentType()` - Determines the correct MIME type for files
- `formatBytes()` - Formats file sizes in human-readable form
- `uploadToArweave()` - Handles file upload with progress tracking
- `uploadFolderToArweave()` - Handles multiple file uploads


## Learn More

- [Arweave Documentation](https://docs.arweave.org/)
- [ArConnect Documentation](https://docs.arconnect.io/)
- [arweave-js Documentation](https://github.com/ArweaveTeam/arweave-js)
- [Next.js Documentation](https://nextjs.org/docs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Arweave

This project includes scripts to deploy your Next.js app to the Arweave permaweb, providing permanent and decentralized hosting.

### Prerequisites

1. An Arweave wallet file (JWK format)
2. Arweave tokens for transaction fees
3. Next.js app configured for static export

### Deployment Steps

1. Copy your Arweave wallet file to the project root as `wallet.json`:
   ```bash
   cp your-wallet.json wallet.json
   ```

2. Run the deployment script:
   ```bash
   pnpm deploy
   ```

3. Once completed, your app will be permanently available on Arweave at the URL provided in the console output.

### How it Works

The deployment process:
1. Builds your Next.js app as a static site
2. Uploads all files to Arweave using the Turbo service
3. Creates an Arweave manifest to preserve the directory structure
4. Returns a transaction ID that serves as the root of your deployed app

Your app will be available at `https://arweave.net/[TRANSACTION_ID]`
