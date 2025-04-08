# Next.js Arweave Upload Demo

This project demonstrates how to upload files to the Arweave permaweb directly from a browser using Next.js 15, ArConnect wallet, and Turbo SDK.

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

## Client-Side Turbo SDK Implementation

This project features a fully client-side implementation for uploading files to the Arweave network directly from the browser using ArDrive's Turbo SDK. The key innovation here is making the Turbo SDK work in a browser environment through specific Next.js configurations.

### Upload Flow

1. **User connects wallet** - ArConnect browser extension is used for wallet connection
2. **User selects file(s)** - Via drag & drop or file picker
3. **Upload is initiated** - Client-side code handles the entire upload process
4. **ArConnect signer is created** - Using the connected wallet
5. **Turbo SDK client is initialized** - With the ArConnect signer
6. **File is uploaded** - Using Turbo SDK's uploadFile method
7. **URL is generated** - For permanent access to the uploaded file

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │  ArConnect  │     │  Turbo SDK  │     │   Arweave   │
│    Client   │     │    Wallet   │     │             │     │   Network   │
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
       │ Create ArConnect Signer               │                   │
       │────────────────────────────────────────>                  │
       │                   │                   │ Initialize Turbo  │
       │                   │                   │────┐              │
       │                   │                   │    │              │
       │                   │                   │<───┘              │
       │                   │                   │                   │
       │                   │                   │ Upload File       │
       │                   │                   │──────────────────>│
       │                   │                   │                   │
       │                   │                   │ Transaction ID    │
       │                   │                   │<──────────────────│
       │ Upload Complete   │                   │                   │
       │<─────────────────────────────────────────────────────────│
       │                   │                   │                   │
```

### Making Turbo SDK Work in the Browser

Getting the Turbo SDK to work in a client-side Next.js app required specific configurations:

#### 1. Next.js Configuration

The `next.config.ts` file includes webpack overrides to handle Node.js dependencies that Turbo SDK depends on:

```javascript
// next.config.ts
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Replace problematic deps with browser versions
      'bitcoinjs-lib': 'bitcoinjs-lib/dist/bitcoin.js',
      'ecpair': 'ecpair/dist/ecpair.js',
    };

    // Add polyfills for Node.js built-ins
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    };

    // Add plugins for browser polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      })
    );

    return config;
  }
};
```

#### 2. Dependencies

To make the Turbo SDK work client-side, the project uses:

```json
"dependencies": {
  "@ardrive/turbo-sdk": "^1.0.0-alpha.5", // Latest alpha with browser support
  "bitcoinjs-lib": "^6.1.5",
  "buffer": "^6.0.3",
  "crypto-browserify": "^3.12.0",
  "process": "^0.11.10",
  "stream-browserify": "^3.0.0"
}
```

### Files Involved

#### Core Application Files

- `app/page.tsx` - Main entry point with routing setup
- `app/components/DashboardPage.tsx` - Main upload interface 
- `app/utils/turboClient.ts` - Utility functions for Arweave uploads with Turbo SDK
- `app/context/AuthContext.tsx` - Handles wallet connection state
- `app/utils/arweaveWallet.ts` - Wallet utilities

#### Upload Process Files

| File | Purpose |
|------|---------|
| **next.config.ts** | Configures webpack to support Turbo SDK in the browser |
| **DashboardPage.tsx** | Provides the UI for file uploading; handles drag & drop, file selection, and displays upload progress |
| **turboClient.ts** | Contains core upload functions using Turbo SDK: `uploadToArweave()` and `uploadFolderToArweave()` |
| **AuthContext.tsx** | Manages wallet connection state using ArConnect |

### The Turbo SDK Implementation

The client-side upload process is implemented as follows:

#### 1. Setting up Turbo SDK with ArConnect

```typescript
// app/utils/turboClient.ts
import { TurboFactory, ArconnectSigner } from "@ardrive/turbo-sdk";

// Request wallet permissions
await window.arweaveWallet.connect(['ACCESS_PUBLIC_KEY', 'SIGNATURE', 'SIGN_TRANSACTION']);

// Get wallet address for logging
const walletAddress = await window.arweaveWallet.getActiveAddress();

// Initialize Turbo SDK with ArConnect signer
const signer = new ArconnectSigner(window.arweaveWallet);
const turbo = TurboFactory.authenticated({ signer });
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

### Key Benefits of Turbo SDK

1. **Credit-based uploads** - Users don't need to own AR tokens directly
2. **Lower cost** - Turbo provides cost-effective bundling of transactions
3. **Better privacy** - Files go directly from user to Arweave via Turbo
4. **Simplified architecture** - No need for API routes or server-side code
5. **Better user experience** - Real-time progress updates and feedback

### Technical Considerations

- **Wallet extension required** - Users must have ArConnect installed
- **Browser compatibility** - Special webpack configuration required
- **Alpha status** - Using the latest alpha build of Turbo SDK for browser support
- **Polyfills** - Node.js core modules are polyfilled in the browser

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
- [Turbo SDK Documentation](https://github.com/ardriveapp/turbo-sdk)
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
