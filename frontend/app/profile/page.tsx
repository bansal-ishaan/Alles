// app/profile/page.tsx

'use client'; // This page needs to be a Client Component

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../components/VideoCard';
import type { Video } from '../types';
import { serverUrl } from '@/lib/constants';

// This interface now represents the full channel profile data
interface ChannelProfile {
    _id: string;
    fullName: string;
    username: string;
    subscribersCount: number;
    avatar?: { url: string };
    coverImage?: { url:string };
}

export default function MyChannelPage() {
    const router = useRouter();

    const [profile, setProfile] = useState<ChannelProfile | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs once when the card mounts to find out who is logged in.
    const getCurrentUserId = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // If there's no token, we know no one is logged in.
        setLoggedInUserId(null);
        return;
      }

      try {
        // Fetch the current user details from the backend
        const response = await fetch(
          `${serverUrl}/api/v1/users/current-user`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const result = await response.json();
          // We only need the ID for our comparison
          setLoggedInUserId(result.data._id);
        }
      } catch (error) {
        console.error("Could not fetch current user for VideoCard:", error);
      }
    };

    getCurrentUserId();
  }, []); // The empty array ensures this effect runs only once.

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/auth');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // First, get the current user to find out their username
                const meResponse = await fetch(`${serverUrl}/api/v1/users/current-user`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!meResponse.ok) throw new Error('Could not verify your session.');
                const meData = await meResponse.json();
                const myUsername = meData.data.username;
                const myUserId = meData.data._id;
                
                // Now, fetch the full public channel profile data for ourselves
                const profileResponse = await fetch(`${serverUrl}/api/v1/users/c/${myUsername}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!profileResponse.ok) throw new Error('Failed to fetch your channel profile.');
                const profileData = await profileResponse.json();
                setProfile(profileData.data);

                // Finally, fetch our own videos using our user ID
                const videosResponse = await fetch(`${serverUrl}/api/v1/video/?userId=${myUserId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!videosResponse.ok) throw new Error('Failed to fetch your videos.');
                const videosData = await videosResponse.json();
                setVideos(videosData.data.docs || []);

            } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unexpected error occurred');
  }
}
 finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [router]);

    if (isLoading) return <div className="text-center p-10">Loading Your Channel...</div>;
    if (error) return <div className="text-center p-10 text-red-400">Error: {error}</div>;
    if (!profile) return <div className="text-center p-10">Could not load channel data.</div>;

    return (
        <div className="text-white">
            {/* Cover Image */}
            <div className="relative h-48 w-full bg-gray-800">
                {profile.coverImage?.url && (
                    <img src={profile.coverImage.url} alt="Cover image" className="w-full h-full object-cover" />
                )}
            </div>

            {/* Profile Header */}
            <div className="px-4 md:px-8 -mt-16">
                <div className="flex items-end gap-4">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-gray-900 rounded-full bg-gray-800 flex items-center justify-center">
                        {profile.avatar?.url ? (
                            <img src={profile.avatar.url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span className="text-5xl font-bold">{profile.username.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="flex-1 pb-4 flex justify-between items-end">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{profile.fullName}</h1>
                            <p className="text-sm text-gray-400">@{profile.username} • {profile.subscribersCount} subscribers</p>
                        </div>
                        
                        {/* --- THE NEW BUTTON --- */}
                        <Link href="/dashboard" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold text-sm">
                            Channel Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            {/* User's Videos */}
            <div className="px-4 md:px-8 mt-8">
                <h2 className="text-xl font-bold border-b-2 border-gray-700 pb-2 mb-6">My Uploads</h2>
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.map((video) => (
                            <VideoCard key={video._id} video={video} loggedInUserId={loggedInUserId}/>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">You havent uploaded any videos yet.</p>
                )}
            </div>
        </div>
    );
}