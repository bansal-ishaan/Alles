// app/[username]/page.tsx

'use client'; // 1. THIS IS THE MOST IMPORTANT CHANGE. It makes the page a Client Component.

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../components/VideoCard';
import SubscribeButton from '../components/SubscribeButton';
import type { Video } from '../types';

// Interfaces for the data we expect
interface ChannelProfile {
    _id: string;
    fullName: string;
    username: string;
    subscribersCount: number;
    isSubscribed: boolean;
    avatar: { url: string };
    coverImage?: { url: string };
}
interface LoggedInUser {
    _id: string;
    username: string;
}
export default function ChannelPage() {
  const params = useParams();
  const username = params.username as string;

    // 2. Use React hooks for state management
    const [profile, setProfile] = useState<ChannelProfile | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 3. Use useEffect to fetch all data from the browser side
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            // 4. Get the token from localStorage. This now works because we're in a Client Component.
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                // Fetch all data in parallel
                const [profileRes, loggedInUserRes] = await Promise.all([
                    fetch(`http://localhost:3000/api/v1/users/c/${username}`, { headers, cache: 'no-store' }),
                    token ? fetch('http://localhost:3000/api/v1/users/current-user', { headers, cache: 'no-store' }) : Promise.resolve(null)
                ]);

                // Handle Profile Data
                if (!profileRes.ok) throw new Error('Channel not found.');
                const profileData = await profileRes.json();
                const fetchedProfile = profileData.data;
                setProfile(fetchedProfile);

                // Handle Logged-In User Data
                if (loggedInUserRes && loggedInUserRes.ok) {
                    const loggedInUserData = await loggedInUserRes.json();
                    setLoggedInUser(loggedInUserData.data);
                }

                // Fetch videos after we have the profile ID
                if (fetchedProfile) {
                    const videosRes = await fetch(`http://localhost:3000/api/v1/video/?userId=${fetchedProfile._id}`, { cache: 'no-store' });
                    if (videosRes.ok) {
                        const videosData = await videosRes.json();
                        setVideos(videosData.data.docs || []);
                    }
                }
                
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
    }, [username]); // Re-run the fetch if the username in the URL changes

    // --- Render logic based on state ---
    if (isLoading) return <div className="text-center p-10">Loading Channel...</div>;
    if (error) return <div className="text-center p-10 text-red-400">Error: {error}</div>;
    if (!profile) return <div className="text-center p-10">Channel not found.</div>;

    // Check if the viewer is the owner of this channel
    const isOwner = loggedInUser?._id === profile._id;

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
                    <div className="flex-1 flex flex-col md:flex-row justify-between items-start md:items-center w-full">
                        <div className="mt-2">
                            <h1 className="text-2xl md:text-3xl font-bold">{profile.fullName}</h1>
                            <p className="text-sm text-gray-400">
                                @{profile.username} • {profile.subscribersCount} subscribers • {videos.length} videos
                            </p>
                        </div>
                        <div className="mt-4 md:mt-0 flex-shrink-0">
                            {isOwner ? (
                                <Link href="/profile" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold text-sm">
                                    My Dashboard
                                </Link>
                            ) : (
                                // The SubscribeButton is also a Client Component, so this works perfectly.
                                <SubscribeButton
                                    channelId={profile._id}
                                    initialSubscribedStatus={profile.isSubscribed}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation and Video Grid... (no changes needed here) */}
            <div className="px-4 md:px-8 mt-8">
                <h2 className="text-xl font-bold mb-4">Uploads</h2>
                {videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                        {videos.map((video) => (
                            <VideoCard key={video._id} video={video} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">This channel hasn&apos;t uploaded any videos yet.</p>

                )}
            </div>
        </div>
    );
}