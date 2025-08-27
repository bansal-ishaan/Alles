// app/dashboard/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { serverUrl } from '@/lib/constants';

// Define shapes for the data we'll fetch
interface ChannelStats {
    totalSubscribers: number;
    totalLikes: number;
    totalViews: number;
    totalVideos: number;
}
interface ChannelVideo {
    _id: string;
    thumbnail: { url: string };
    title: string;
    views: number;
    isPublished: boolean;
    likesCount: number;
}

export default function DashboardPage() {
    const router = useRouter();

    const [stats, setStats] = useState<ChannelStats | null>(null);
    const [videos, setVideos] = useState<ChannelVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/auth');
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [statsRes, videosRes] = await Promise.all([
                    fetch(`${serverUrl}/api/v1/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${serverUrl}/api/v1/dashboard/videos`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!statsRes.ok || !videosRes.ok) {
                    throw new Error('Failed to load dashboard data. Please log in again.');
                }
                
                const statsData = await statsRes.json();
                const videosData = await videosRes.json();
                
                setStats(statsData.data);
                setVideos(videosData.data);

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

    if (isLoading) return <div className="p-10 text-center">Loading Dashboard...</div>;
    if (error) return <div className="p-10 text-center text-red-400">Error: {error}</div>;
    if (!stats) return <div className="p-10 text-center">Could not load stats.</div>;

    return (
        <div className="text-white">
            <h1 className="text-3xl font-bold mb-8">Channel Dashboard</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-gray-400 text-sm">Total Views</p><p className="text-2xl font-bold">{stats.totalViews}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-gray-400 text-sm">Subscribers</p><p className="text-2xl font-bold">{stats.totalSubscribers}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-gray-400 text-sm">Total Likes</p><p className="text-2xl font-bold">{stats.totalLikes}</p></div>
                <div className="bg-gray-800 p-4 rounded-lg"><p className="text-gray-400 text-sm">Total Videos</p><p className="text-2xl font-bold">{stats.totalVideos}</p></div>
            </div>

            {/* Video Management Table */}
            <div className="bg-gray-800 p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Content</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th className="px-4 py-3">Video</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Views</th>
                                <th className="px-4 py-3">Likes</th>
                                <th className="px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {videos.map(video => (
                                <tr key={video._id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                    <td className="px-4 py-3 flex items-center gap-3 max-w-sm">
                                        <img src={video.thumbnail.url} alt={video.title} className="w-24 h-14 object-cover rounded"/>
                                        <span className="truncate">{video.title}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${video.isPublished ? 'bg-green-900 text-green-300' : 'bg-gray-600 text-gray-300'}`}>
                                            {video.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{video.views}</td>
                                    <td className="px-4 py-3">{video.likesCount}</td>
                                    <td className="px-4 py-3">
                                        <button className="font-medium text-blue-500 hover:underline">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}