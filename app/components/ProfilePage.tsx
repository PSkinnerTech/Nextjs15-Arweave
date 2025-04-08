import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { walletAddress, primaryName, userName } = useAuth();
  const [isLoadingName, setIsLoadingName] = useState(true);
  
  useEffect(() => {
    if (walletAddress) {
      setIsLoadingName(true);
      const timer = setTimeout(() => {
        setIsLoadingName(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [walletAddress]);
  
  // Display only the first few and last few characters of the address
  const shortenAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">User Profile</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold">
              {primaryName ? primaryName.slice(0, 2).toUpperCase() : 'AR'}
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white">{userName}</h2>
              {isLoadingName ? (
                <p className="text-blue-100">
                  <span className="inline-flex items-center bg-blue-400/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm mr-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-1"></span>
                    Getting Primary Name...
                  </span>
                </p>
              ) : primaryName ? (
                <p className="text-blue-100">
                  <span className="inline-flex items-center bg-blue-400/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm mr-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                    Primary Name
                  </span>
                  {primaryName}
                </p>
              ) : (
                <p className="text-blue-100">
                  <span className="inline-flex items-center bg-yellow-400/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-sm mr-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></span>
                    No Primary Name
                  </span>
                </p>
              )}
              <p className="text-white mt-2 text-sm">
                Address: {shortenAddress(walletAddress || '')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Account Information */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Display Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                value={userName}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Primary Name</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                  value={isLoadingName ? "Getting Primary Name..." : (primaryName || 'No Primary Name')}
                  readOnly
                />
                {isLoadingName ? (
                  <div className="ml-2 text-blue-600">⟳</div>
                ) : primaryName ? (
                  <div className="ml-2 text-green-600">✓</div>
                ) : (
                  <div className="ml-2 text-amber-600">!</div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Wallet Address</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm" 
                value={walletAddress || ''}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 