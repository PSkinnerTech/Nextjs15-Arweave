'use client';

import { useEffect, useState } from 'react';
import ConnectWallet from './ConnectWallet';

const Navbar = () => {
  const [currentHash, setCurrentHash] = useState('');

  useEffect(() => {
    // Get initial hash
    setCurrentHash(window.location.hash || '#/');
    
    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash || '#/';
      setCurrentHash(newHash);
      console.log('Navbar detected hash change to:', newHash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Custom Link component to handle hash navigation properly
  const HashLink = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => {
    const isActive = currentHash === href;
    const combinedClassName = `${className || ''} ${isActive ? 'font-bold underline' : ''}`.trim();
    
    return (
      <a 
        href={href} 
        className={combinedClassName}
        onClick={(e) => {
          if (window.location.hash === href) {
            // If already on this route, prevent default and force a re-render
            e.preventDefault();
            window.dispatchEvent(new HashChangeEvent('hashchange'));
          }
        }}
      >
        {children}
      </a>
    );
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white font-bold text-lg">Arweave App</div>
        <div className="flex items-center space-x-6">
          <div className="space-x-4">
            <HashLink 
              href="#/" 
              className="text-white hover:text-gray-300"
            >
              Home
            </HashLink>
            <HashLink 
              href="#/dashboard" 
              className="text-white hover:text-gray-300"
            >
              Dashboard
            </HashLink>
            <HashLink 
              href="#/profile" 
              className="text-white hover:text-gray-300"
            >
              Profile
            </HashLink>
          </div>
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 