'use client';

import { useState, useEffect, ReactNode } from 'react';

// Define route types
type Route = {
  path: string;
  component: ReactNode;
};

type HashRouterProps = {
  routes: Route[];
  defaultComponent: ReactNode;
};

const HashRouter = ({ routes, defaultComponent }: HashRouterProps) => {
  // Use a key to force re-render of components
  const [currentHash, setCurrentHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash || '#/' : '#/');

  useEffect(() => {
    // Initial route setup
    const initialHash = window.location.hash || '#/';
    setCurrentHash(initialHash);
    
    // Setup hash change listener
    const handleHashChange = () => {
      const newHash = window.location.hash || '#/';
      setCurrentHash(newHash);
      console.log('Hash changed to:', newHash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);
  
  // Find the component to render based on the current hash
  const getComponentForHash = (hash: string) => {
    const route = routes.find(r => r.path === hash);
    return route ? route.component : defaultComponent;
  };
  
  return (
    <div key={currentHash}>
      {getComponentForHash(currentHash)}
    </div>
  );
};

export default HashRouter; 