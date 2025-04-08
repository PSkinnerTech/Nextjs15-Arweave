import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { isConnected, walletAddress, primaryName, userName, connect } = useAuth();
  const [isLoadingName, setIsLoadingName] = useState(true);
  
  useEffect(() => {
    if (isConnected) {
      setIsLoadingName(true);
      const timer = setTimeout(() => {
        setIsLoadingName(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isConnected, walletAddress]);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Welcome to Arweave App</h1>
      <p className="text-lg mb-4">
        This is a simple demonstration of a Next.js application deployed permanently on the Arweave network.
      </p>
      <p className="text-lg mb-4">
        The application uses hash-based routing to enable navigation without server-side routing, making it
        perfect for decentralized hosting on Arweave.
      </p>
      
      {!isConnected ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-3">Connect Your Wallet</h2>
          <p className="mb-4">
            Connect your Arweave wallet to access the Dashboard and Profile pages.
          </p>
          <button 
            onClick={() => connect()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-3">Wallet Connected</h2>
          {isLoadingName ? (
            <div className="mb-4">
              <p className="text-blue-600 mb-4">Getting Primary Name...</p>
            </div>
          ) : primaryName ? (
            <div className="mb-4">
              <p className="mb-1">Username (Primary Name):</p>
              <p className="font-semibold text-lg text-green-700">{primaryName}</p>
            </div>
          ) : (
            <p className="text-amber-600 mb-4">No Primary Name found for this wallet</p>
          )}
          <p className="mb-2">
            Wallet address:
          </p>
          <p className="font-mono bg-white p-2 rounded border border-gray-200 mb-4 overflow-hidden text-ellipsis">
            {walletAddress}
          </p>
          <p>
            You now have access to the Dashboard and Profile pages.
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage; 