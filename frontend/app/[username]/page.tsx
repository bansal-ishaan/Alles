'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import VideoCard from '../components/VideoCard';
import SubscribeButton from '../components/SubscribeButton';
import type { Video } from '../types';
import { serverUrl } from '@/lib/constants';

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
    const username = params?.username as string;

    const [profile, setProfile] = useState<ChannelProfile | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [loggedInUser, setLoggedInUser] = useState<LoggedInUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!username) {
            setError('No username provided');
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

                const [profileRes, loggedInUserRes] = await Promise.all([
                    fetch(`${serverUrl}/api/v1/users/c/${username}`, { headers, cache: 'no-store' }),
                    token ? fetch(`${serverUrl}/api/v1/users/current-user`, { headers, cache: 'no-store' }) : Promise.resolve(null)
                ]);

                if (!profileRes.ok) {
                    if (profileRes.status === 404) throw new Error('Channel not found');
                    throw new Error(`Failed to load channel: ${profileRes.status}`);
                }
                
                const profileData = await profileRes.json();
                const fetchedProfile = profileData.data;
                if (!fetchedProfile) throw new Error('Channel data is invalid');
                setProfile(fetchedProfile);

                if (loggedInUserRes && loggedInUserRes.ok) {
                    const loggedInUserData = await loggedInUserRes.json();
                    setLoggedInUser(loggedInUserData.data);
                }

                const videosRes = await fetch(`${serverUrl}/api/v1/video/?userId=${fetchedProfile._id}`, { cache: 'no-store' });
                if (videosRes.ok) {
                    const videosData = await videosRes.json();
                    setVideos(Array.isArray(videosData.data?.docs) ? videosData.data.docs : []);
                }
            } catch (err) {
                console.error('Error fetching channel data:', err);
                setError(err instanceof Error ? err.message : 'An unexpected error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [username]);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="text-center p-10">
                    <div className="animate-pulse">Loading Channel...</div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="text-center p-10 text-red-400">
                    <h2 className="text-xl font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Profile not found
    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="text-center p-10">Channel not found.</div>
            </div>
        );
    }

    // Check if the viewer is the owner of this channel
    const isOwner = loggedInUser?._id === profile._id;

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Cover Image */}
            <div className="relative h-48 w-full bg-gray-800">
                {profile.coverImage?.url && (
                    <img 
                        src={profile.coverImage.url} 
                        alt="Cover image" 
                        className="w-full h-full object-cover" 
                    />
                )}
            </div>

            {/* Profile Header */}
            <div className="px-4 md:px-8 -mt-16">
                <div className="flex items-end gap-4">
                    <div className="relative w-32 h-32 md:w-40 md:h-40 border-4 border-gray-900 rounded-full bg-gray-800 flex items-center justify-center">
                        {profile.avatar?.url ? (
                            <img 
                                src={profile.avatar.url} 
                                alt="Avatar" 
                                className="w-full h-full rounded-full object-cover" 
                            />
                        ) : (
                            <span className="text-5xl font-bold">
                                {profile.username.charAt(0).toUpperCase()}
                            </span>
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
                                <Link 
                                    href="/profile" 
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-full font-semibold text-sm transition-colors"
                                >
                                    My Dashboard
                                </Link>
                            ) : (
                                <SubscribeButton
                                    channelId={profile._id}
                                    initialSubscribedStatus={profile.isSubscribed}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Videos Section */}
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