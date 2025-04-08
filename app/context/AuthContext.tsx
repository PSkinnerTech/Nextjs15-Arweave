'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useConnection, useActiveAddress } from '@arweave-wallet-kit/react';
import { getPrimaryName } from '../utils/getPrimaryName';

interface AuthContextType {
  isConnected: boolean;
  walletAddress: string | null;
  primaryName: string | null;
  userName: string;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isConnected: false,
  walletAddress: null,
  primaryName: null,
  userName: 'Arweave User',
  connecting: false,
  connect: async () => {},
  disconnect: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { connect, disconnect } = useConnection();
  const address = useActiveAddress();
  const [connecting, setConnecting] = useState(false);
  const [primaryName, setPrimaryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if wallet is connected
  const isConnected = !!address;

  // Connect wallet
  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      await disconnect();
      setPrimaryName(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  // Calculate username from primary name or display "No Primary Name"
  const userName = primaryName || (isConnected ? 'No Primary Name' : 'Arweave User');

  // Fetch primary name when wallet address changes
  useEffect(() => {
    const fetchPrimaryName = async () => {
      if (address) {
        setLoading(true);
        try {
          const name = await getPrimaryName(address);
          setPrimaryName(name);
        } catch (error) {
          console.error('Error fetching primary name:', error);
          setPrimaryName(null);
        } finally {
          setLoading(false);
        }
      } else {
        setPrimaryName(null);
      }
    };

    fetchPrimaryName();
  }, [address]);

  const value = {
    isConnected,
    walletAddress: address || null,
    primaryName,
    userName,
    connecting,
    connect: handleConnect,
    disconnect: handleDisconnect,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 