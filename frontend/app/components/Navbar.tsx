// app/components/Navbar.tsx

'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { GoPlusCircle, GoSearch } from 'react-icons/go';
import { IoNotificationsOutline } from 'react-icons/io5';
import { useState, useEffect } from 'react';
import { HiMenu } from 'react-icons/hi';
import { serverUrl } from '@/lib/constants';

interface CurrentUser {
  username: string;
  avatar?: { url: string };
}

export default function Navbar() {
  const { isLoggedIn, logout, toggleSidebar } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // This effect correctly fetches user details when the login state changes.
  // No changes are needed here.
  useEffect(() => {
    if (!isLoggedIn) {
      setCurrentUser(null);
      return;
    }

    const fetchUserDetails = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await fetch(`${serverUrl}/api/v1/users/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setCurrentUser(result.data);
        } else {
          // If the token is invalid (e.g., expired), log the user out
          console.error('Navbar: Invalid token. Logging out.');
          logout();
        }
      } catch (error) {
        console.error('Navbar: Failed to fetch user details', error);
      }
    };

    fetchUserDetails();
  }, [isLoggedIn, logout]);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 bg-[#0F0F0F]  text-white">
      {/* --- DESKTOP VIEW --- */}
      {!isMobile && (
        <>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <HiMenu className="text-xl" />
            </button>
            <Link href="/" className="text-xl font-bold">
              Alles
            </Link>
          </div>

          <div className="flex-grow max-w-2xl flex">
            <input
              type="text"
              placeholder="Search"
              className="w-full px-4 py-2 text-white bg-gray-900 border border-gray-700 rounded-l-full focus:outline-none focus:border-blue-500"
            />
            <button className="px-5 py-2 bg-gray-800 border border-gray-700 border-l-0 rounded-r-full hover:bg-gray-700">
              <GoSearch />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {isLoggedIn && currentUser ? (
              // --- LOGGED-IN VIEW (Desktop) ---
              <>
                <Link
                  href="/upload"
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-700"
                  title="Create"
                >
                  <GoPlusCircle className="text-2xl" />
                </Link>
                <button
                  className="p-2 rounded-full hover:bg-gray-700"
                  title="Notifications"
                >
                  <IoNotificationsOutline className="text-2xl" />
                </button>

                <div className="group relative">
                  <Link
                    href={`/profile`}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700"
                    title="My Channel"
                  >
                    {currentUser.avatar?.url ? (
                      <img
                        src={currentUser.avatar.url}
                        alt={currentUser.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="font-bold text-white text-lg">
                        {currentUser.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <button
                    onClick={logout}
                    className="absolute right-0 top-10 w-24 px-4 py-2 bg-gray-800 text-sm text-gray-300 hover:text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              // --- LOGGED-OUT VIEW (Desktop) ---
              // This block renders when the user is not logged in.
              // It now includes the GoogleLoginButton.
              <div className="flex items-center gap-2">
                <Link
                  href="/upload"
                  className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-700"
                  title="Create"
                >
                  <GoPlusCircle className="text-2xl" />
                </Link>
                <button
                  className="p-2 rounded-full hover:bg-gray-700"
                  title="Notifications"
                >
                  <IoNotificationsOutline className="text-2xl" />
                </button>
                <Link
                  href="/auth"
                  className="px-4 py-2 text-sm text-blue-400 border border-gray-700 rounded-full hover:bg-blue-400/10"
                >
                  Login / Signup
                </Link>
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MOBILE VIEW --- */}
      {isMobile && (
        <>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">
              Alles
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-full hover:bg-gray-700" title="Search">
              <GoSearch className="text-xl" />
            </button>

            {isLoggedIn && currentUser ? (
                // --- LOGGED-IN VIEW (Mobile) ---
                <>
                    <Link
                        href="/upload"
                        className="p-2 rounded-full hover:bg-gray-700"
                        title="Upload"
                    >
                        <GoPlusCircle className="text-xl" />
                    </Link>
                    <Link
                        href={`/channel/${currentUser.username}`}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700"
                    >
                         {currentUser.avatar?.url ? (
                            <img
                                src={currentUser.avatar.url}
                                alt={currentUser.username}
                                className="w-full h-full rounded-full object-cover"
                            />
                            ) : (
                            <span className="font-bold text-white text-lg">
                                {currentUser.username.charAt(0).toUpperCase()}
                            </span>
                        )}
                    </Link>
                </>
            ) : (
                // --- LOGGED-OUT VIEW (Mobile) ---
                
                <Link
                  href="/auth"
                  className="px-3 py-1.5 text-sm text-blue-400 border border-gray-700 rounded-full hover:bg-blue-400/10"
                >
                  Login
                </Link>
            )}
            
          </div>
        </>
      )}
    </nav>
  );
}
