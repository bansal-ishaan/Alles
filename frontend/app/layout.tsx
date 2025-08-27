// app/layout.tsx

import type { Metadata } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import MainContent from './components/MainContent'; // We'll create this new component
import GoogleAuthHandler from './components/GoogleAuthHandler';
export const metadata: Metadata = {
  title: 'MyTube',
  description: 'A modern video sharing platform',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0F0F0F] text-gray-200">
        <AuthProvider>
          <GoogleAuthHandler/>
          <div className="flex flex-col h-screen">
            {/* Navbar is now at the top level, always full width */}
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar is also at this level */}
              {/* <Sidebar /> */}
              {/* MainContent is a new client component that handles the dynamic margin */}
              <MainContent>
                {children}
              </MainContent>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}