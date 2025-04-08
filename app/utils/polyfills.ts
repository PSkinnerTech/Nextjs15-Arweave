'use client';

// Add global polyfills needed for AR.IO SDK
if (typeof window !== 'undefined') {
  // Import and set up Buffer
  import('buffer').then(({ Buffer }) => {
    window.Buffer = Buffer;
  });

  // Import and set up process
  import('process/browser').then((process) => {
    // Use a type assertion to bypass TypeScript's type checking
    window.process = process as any;
    
    // Ensure process.env exists
    if (!window.process.env) {
      window.process.env = {
        NODE_ENV: 'production',
        NEXT_PUBLIC_ARWEAVE_GATEWAY: 'arweave.net'
      };
    }
    
    // Set environment for development purposes
    try {
      window.process.env.NODE_ENV = 'production';
    } catch (e) {
      console.warn('Could not set process.env.NODE_ENV:', e);
    }
  });

  // Preload the arbundlesUtils mock to ensure it's available
  import('./arbundlesUtils').then((utils) => {
    console.log('Arbundles utils loaded');
  });
  
  // Add AR.IO SDK specific config
  window.arioConfig = {
    debugMode: true, // Enable debugging
    // Override default AR.IO gateway if needed
    // gateway: 'https://gateway.ar.io', 
    // Timeout in milliseconds for fetch requests
    fetchTimeout: 30000,
  };
  
  // Log environment info to help with debugging
  console.log('Environment setup complete for AR.IO SDK');
}

// Buffer polyfill
import { Buffer } from 'buffer';

// Ensure global Buffer is available
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

// Ensure process.env exists
if (typeof window !== 'undefined') {
  if (!window.process) {
    window.process = { env: { NODE_ENV: 'production' } } as any;
  }

  if (!window.process.env) {
    window.process.env = { 
      NODE_ENV: 'production',
      NEXT_PUBLIC_ARWEAVE_GATEWAY: 'arweave.net'
    };
  }

  try {
    // Set NODE_ENV for development
    window.process.env.NODE_ENV = 'production';
  } catch (e) {
    console.warn('Failed to set process.env, some features might not work correctly', e);
  }
}

// Add polyfills for fs and stream needed by Turbo SDK
if (typeof window !== 'undefined') {
  // Mock fs module with minimal implementation
  const mockFs = {
    promises: {
      readFile: async () => {
        throw new Error('fs.readFile is not available in browser environment');
      },
      writeFile: async () => {
        throw new Error('fs.writeFile is not available in browser environment');
      }
    },
    readFileSync: () => {
      throw new Error('fs.readFileSync is not available in browser environment');
    },
    writeFileSync: () => {
      throw new Error('fs.writeFileSync is not available in browser environment');
    },
    createReadStream: () => {
      throw new Error('fs.createReadStream is not available in browser environment');
    }
  };
  
  // @ts-ignore - add mock modules to window
  window.fs = mockFs;
  
  console.log('Polyfills initialized. Buffer and process.env are available.');
}

// Arweave bundle utils mock
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.arbundlesUtils = {};
}

// Add turbo client config if not exists
if (typeof window !== 'undefined' && !window.arioConfig) {
  window.arioConfig = {
    debugMode: true,
    fetchTimeout: 60000,
  };
}

export {}; 