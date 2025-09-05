// app/components/Sidebar.tsx
'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { GoHome, GoVideo } from 'react-icons/go';
import { MdSubscriptions, MdOutlineHistory, MdOutlineThumbUp } from 'react-icons/md';
import { IoMdChatbubbles } from "react-icons/io";
import { serverUrl } from '@/lib/constants';
import { FaTwitter } from 'react-icons/fa';
import { GiStarsStack } from "react-icons/gi"; // New Luna icon ✨

// Define a type for the subscribed channel data we expect from the API
interface SubscribedChannel {
  subscribedChannel: {
    _id: string;
    username: string;
    fullName: string;
    avatar: { url: string };
  };
}

const SidebarLink = ({ icon, text, href, isOpen }: { icon: React.ReactNode, text: string, href: string, isOpen: boolean }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 py-2 rounded-lg hover:bg-gray-700 ${isOpen ? 'px-3' : 'px-2 justify-center'}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
        {text}
      </span>
    </Link>
  );
};

export default function Sidebar() {
  const { isSidebarOpen } = useAuth();
  const { isLoggedIn } = useAuth();

  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      setSubscriptions([]);
      return;
    }

    const fetchSubscriptions = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const meResponse = await fetch(`${serverUrl}/api/v1/users/current-user`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!meResponse.ok) return;

        const meData = await meResponse.json();
        const myUserId = meData.data._id;

        const subResponse = await fetch(`${serverUrl}/api/v1/subscriptions/u/${myUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (subResponse.ok) {
          const result = await subResponse.json();
          setSubscriptions(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error);
      }
    };

    fetchSubscriptions();
  }, [isLoggedIn]);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0F0F0F] p-2 flex-col transition-all duration-300 hidden md:flex
      ${isSidebarOpen ? 'w-60' : 'w-20'}`}
    >
      <div className="space-y-1 mt-16">
        <SidebarLink icon={<GoHome />} text="Home" href="/" isOpen={isSidebarOpen} />
        <SidebarLink icon={<FaTwitter />} text="Tweets" href="/tweets" isOpen={isSidebarOpen} />
        <SidebarLink icon={<IoMdChatbubbles />} text="Chat" href="/chat" isOpen={isSidebarOpen} />
        
        {/* 🌙 New Luna Chatbot Link */}
        <SidebarLink icon={<GiStarsStack />} text="Luna AI" href="/chatbot" isOpen={isSidebarOpen} />

        <SidebarLink icon={<MdSubscriptions />} text="Subscriptions" href="/subscriptions" isOpen={isSidebarOpen} />
      </div>

      <hr className="my-4 border-gray-700" />

      <div className="space-y-1">
        <SidebarLink icon={<MdOutlineHistory />} text="History" href="/history" isOpen={isSidebarOpen} />
        <SidebarLink icon={<GoVideo />} text="Your videos" href="/profile" isOpen={isSidebarOpen} />
        <SidebarLink icon={<MdOutlineThumbUp />} text="Liked videos" href="/liked" isOpen={isSidebarOpen} />
      </div>

      {/* Subscriptions list */}
      <div className={`transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <hr className="my-4 border-gray-700" />
        <h2 className="px-3 text-sm font-semibold text-gray-400">Subscriptions</h2>
        <div className="mt-2 space-y-1">
          {subscriptions.map(({ subscribedChannel }) => (
            <Link
              key={subscribedChannel._id}
              href={`/${subscribedChannel.username}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800"
            >
              <img
                src={subscribedChannel.avatar.url}
                alt={subscribedChannel.fullName}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {subscribedChannel.fullName}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
