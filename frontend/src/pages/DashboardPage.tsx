import React, { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useWebSocket } from '@hooks/useWebSocket';
import { Header } from '@components/layout/Header';
import { Sidebar } from '@components/layout/Sidebar';
import { GamePage } from './GamePage';

/**
 * DashboardPage Component
 * Main layout component that contains the game interface
 * Requirements: 2.2.1, 2.2.2, 2.2.3, 2.7.1, 2.7.2, 2.7.3
 */
export const DashboardPage: React.FC = () => {
  const { token } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Initialize WebSocket connection
  useWebSocket(token);

  // Close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Game Content */}
        <main 
          className="flex-1 flex flex-col"
          role="main"
          aria-label="Game interface"
        >
          <GamePage onSidebarToggle={handleSidebarToggle} />
        </main>

        {/* Sidebar */}
        <aside 
          role="complementary"
          aria-label="Game statistics and history"
        >
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
          />
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;