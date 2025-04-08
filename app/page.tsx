'use client';

import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import HashRouter from './components/HashRouter';
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import ProfilePage from './components/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import { Providers } from './providers';
import { AuthProvider } from './context/AuthContext';
// Import polyfills
import './utils/polyfills';

export default function Home() {
  // Use state to handle initial client-side rendering
  const [isClient, setIsClient] = useState(false);
  
  // Set isClient to true after initial render
  useEffect(() => {
    setIsClient(true);
    
    // Set initial hash if none exists
    if (!window.location.hash) {
      window.location.hash = '#/';
    }
  }, []);
  
  // Define routes with exact hash paths
  const routes = [
    { 
      path: '#/', 
      component: <HomePage /> 
    },
    { 
      path: '#/dashboard', 
      component: <ProtectedRoute><DashboardPage /></ProtectedRoute> 
    },
    { 
      path: '#/profile', 
      component: <ProtectedRoute><ProfilePage /></ProtectedRoute> 
    }
  ];
  
  // Show a simple loading state before client-side rendering
  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <h1 className="text-2xl font-semibold text-gray-600">Loading...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <Providers>
      <AuthProvider>
        <main className="min-h-screen bg-gray-100">
          <Navbar />
          <HashRouter 
            routes={routes} 
            defaultComponent={<HomePage />} 
          />
        </main>
      </AuthProvider>
    </Providers>
  );
}
