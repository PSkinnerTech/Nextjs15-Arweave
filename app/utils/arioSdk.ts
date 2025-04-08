'use client';

import { ARIO } from '@ar.io/sdk';

/**
 * Initializes and returns a configured instance of the AR.IO SDK
 * Uses any window.arioConfig settings if available
 */
export function getARIOInstance() {
  try {
    // ARIO.init() doesn't require parameters; let SDK use defaults
    console.log('Initializing AR.IO SDK with default configuration');
    const sdk = ARIO.init();
    
    // Set debug mode if available in window config
    if (typeof window !== 'undefined' && window.arioConfig && window.arioConfig.debugMode) {
      console.log('Setting debug mode from window config');
    }
    
    return sdk;
  } catch (error) {
    console.error('Error initializing AR.IO SDK:', error);
    // Try again with minimal config
    return ARIO.init();
  }
} 
