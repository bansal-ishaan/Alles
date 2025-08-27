"use client";

import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const { isSidebarOpen, isCompleteClose } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const showSidebar = !isMobile && !isCompleteClose;

  let marginClass = 'ml-0';
  if (showSidebar) {
    marginClass = isSidebarOpen ? 'ml-60' : 'ml-20';
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {showSidebar && <Sidebar />}

      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${marginClass}`}
      >
        {children}
      </main>
    </div>
  );
}
