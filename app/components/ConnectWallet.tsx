'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ConnectButton } from '@arweave-wallet-kit/react';

interface ConnectWalletProps {
  className?: string;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ className = '' }) => {
  const { isConnected, walletAddress, disconnect } = useAuth();

  // Custom styling for the ConnectButton - ensure we don't rely on default styles
  const buttonClass = `px-4 py-2 rounded-md text-white font-medium ${className}`;

  if (isConnected && walletAddress) {
    return (
      <div className="flex flex-col items-center">
        <div className="bg-gray-100 rounded-md px-4 py-2 text-sm text-gray-800 mb-2 overflow-hidden text-ellipsis max-w-[200px]">
          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
        <button
          className={`${buttonClass} bg-red-500 hover:bg-red-600`}
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <ConnectButton
      className={`${buttonClass} bg-blue-600 hover:bg-blue-700`}
      style={{ 
        borderRadius: '0.375rem',
        padding: '0.5rem 1rem',
        color: 'white',
        backgroundColor: '#2563eb',
        fontWeight: '500',
        cursor: 'pointer'
      }}
      label="Connect Wallet"
    />
  );
};

export default ConnectWallet; 