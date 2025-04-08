'use client';

/**
 * Export an Arweave wallet JWK from ArConnect
 * This allows us to send the JWK to the server for auth without needing to use the Turbo SDK client-side
 */
export async function exportWallet(): Promise<string | null> {
  if (!window.arweaveWallet) {
    console.error('Arweave wallet not found. Please install ArConnect.');
    return null;
  }
  
  try {
    // Request permission to export the wallet
    await window.arweaveWallet.connect(['ACCESS_PUBLIC_KEY', 'SIGNATURE', 'DISPATCH', 'ACCESS_ARWEAVE_CONFIG']);
    
    // Check if we can use the wallet
    const address = await window.arweaveWallet.getActiveAddress();
    if (!address) {
      console.error('No active Arweave wallet found.');
      return null;
    }
    
    // Use dispatch to get the JWK (this is safer than using the raw JWK which may not be available)
    const rawJwk = await window.arweaveWallet.dispatch('get_jwk_for_turbo_upload');
    
    if (!rawJwk) {
      console.error('Failed to export JWK from ArConnect.');
      return null;
    }
    
    return JSON.stringify(rawJwk);
  } catch (error) {
    console.error('Error exporting Arweave wallet:', error);
    return null;
  }
}

/**
 * Mock wallet export for testing or development
 * This is a fallback method when ArConnect's dispatch method fails
 */
export async function mockExportWallet(): Promise<string> {
  // Generate a mock JWK for testing (in real usage, never expose actual JWKs)
  const mockJwk = {
    kty: "RSA",
    e: "AQAB",
    n: "mockPublicKey",
    d: "mockPrivateKey",
    p: "mockPrime1",
    q: "mockPrime2",
    dp: "mockExponent1",
    dq: "mockExponent2",
    qi: "mockCoefficient"
  };
  
  // Wrapper for temporary development use - real wallet code would be much more secure
  return JSON.stringify(mockJwk);
}

/**
 * Safely export wallet JWK, falling back to mock if needed
 * @param useMock Whether to use a mock JWK for testing
 * @returns JWK string or null if operation failed
 */
export async function safeExportWallet(useMock = false): Promise<string | null> {
  if (useMock) {
    return mockExportWallet();
  }
  
  // Try to export the real wallet
  try {
    const jwk = await exportWallet();
    if (jwk) return jwk;
    
    // If export failed but we're in development, fall back to mock
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock wallet for development - DO NOT USE IN PRODUCTION');
      return mockExportWallet();
    }
    
    return null;
  } catch (error) {
    console.error('Error exporting wallet:', error);
    
    // Same fallback logic for errors
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock wallet after error - DO NOT USE IN PRODUCTION');
      return mockExportWallet();
    }
    
    return null;
  }
} 