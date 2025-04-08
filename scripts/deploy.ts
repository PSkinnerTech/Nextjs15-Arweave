import fs from 'fs';
import { Buffer } from 'node:buffer';
import TurboDeploy from './turbo';
import { JWKInterface } from 'arweave/node/lib/wallet';

/**
 * Parses the wallet data from JSON or base64 encoded JSON
 * @param input The wallet data as JSON or base64 encoded JSON
 * @returns The parsed wallet object
 */
function parseWallet(input: string): JWKInterface {
  try {
    return JSON.parse(input);
  } catch {
    try {
      return JSON.parse(Buffer.from(input, 'base64').toString('utf-8'));
    } catch {
      throw new Error('Invalid wallet format. Must be JSON or base64 encoded JSON');
    }
  }
}

/**
 * Main function to deploy the app to Arweave
 */
async function main(): Promise<void> {
  const walletPath = './wallet.json';
  
  // Check if wallet file exists
  if (!fs.existsSync(walletPath)) {
    console.error('wallet.json not found in project root');
    process.exit(1);
  }
  
  try {
    const walletData = fs.readFileSync(walletPath, 'utf8');
    const jwk = parseWallet(walletData);
    
    // Deploy to Arweave
    const manifestId = await TurboDeploy(jwk);
    
    console.log(`\nDeployment Complete! 🎉`);
    console.log(`View your deployment at: https://arweave.net/${manifestId}\n`);
  } catch (e) {
    console.error('Deployment failed:', e);
    process.exit(1);
  }
}

// Run the main function
main(); 