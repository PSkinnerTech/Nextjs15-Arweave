'use client';

import React, { ReactNode } from 'react';
import { ArweaveWalletKit } from '@arweave-wallet-kit/react';
import WanderStrategy from '@arweave-wallet-kit/wander-strategy';
import OthentStrategy from '@arweave-wallet-kit/othent-strategy';
import BrowserWalletStrategy from '@arweave-wallet-kit/browser-wallet-strategy';
import WebWalletStrategy from '@arweave-wallet-kit/webwallet-strategy';
// Note: Styles are imported differently in Next.js - see globals.css

interface ProviderProps {
  children: ReactNode;
}

export function Providers({ children }: ProviderProps) {
  return (
    <ArweaveWalletKit
      config={{
        permissions: [
          'ACCESS_ADDRESS',
          'ACCESS_PUBLIC_KEY',
          'SIGN_TRANSACTION',
          'DISPATCH',
        ],
        ensurePermissions: true,
        strategies: [
          new WanderStrategy(),
          new OthentStrategy(),
          new BrowserWalletStrategy(),
          new WebWalletStrategy(),
        ],
      }}
    >
      {children}
    </ArweaveWalletKit>
  );
} 