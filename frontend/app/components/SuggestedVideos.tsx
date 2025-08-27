// app/components/SuggestedVideos.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Video } from '../types'; // Assuming this is your shared video type
import { formatDuration, formatTimeAgo } from '@/lib/utils';
import { serverUrl } from '@/lib/constants';

// A smaller, dedicated component for a single suggestion item
function SuggestionCard({ video }: { video: Video }) {
    return (
        <Link href={`/watch/${video._id}`} className="flex gap-2 group">
            <div className="relative w-40 h-24 flex-shrink-0">
                <img 
                    src={video.thumbnail.url} 
                    alt={video.title} 
                    className="w-full h-full object-cover rounded-lg"
                />
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs font-semibold px-1 py-0.5 rounded">
                    {formatDuration(video.duration)}
                </span>
            </div>
            <div className="flex flex-col">
                <h4 className="text-sm font-bold line-clamp-2 leading-tight text-white group-hover:text-gray-300">
                    {video.title}
                </h4>
                <p className="text-xs text-gray-400 mt-1">{video.ownerDetails.username}</p>
                <p className="text-xs text-gray-400">
                    {video.views} views • {formatTimeAgo(video.createdAt)}
                </p>
            </div>
        </Link>
    );
}


export default function SuggestedVideos({ currentVideoId, channelId }: { currentVideoId: string, channelId: string }) {
    const [allVideos, setAllVideos] = useState<Video[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllVideos = async () => {
            setIsLoading(true);
            try {
                // Fetch a general list of public videos
                const res = await fetch(`${serverUrl}/api/v1/video`);
                if (!res.ok) throw new Error("Failed to fetch suggestions");
                const result = await res.json();
                setAllVideos(result.data.docs || []);
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

        fetchAllVideos();
    }, [currentVideoId]); // Refetch if the user navigates to a new video

    // --- Reordering Logic using useMemo for performance ---
    const sortedVideos = useMemo(() => {
        if (!allVideos.length) return [];

        const sameChannelVideos: Video[] = [];
        const otherVideos: Video[] = [];

        allVideos.forEach(video => {
            // Don't suggest the video that is currently playing
            if (video._id === currentVideoId) {
                return;
            }

            // Check if the video's owner matches the current channel's owner
            if (video.ownerDetails._id === channelId) {
                sameChannelVideos.push(video);
            } else {
                otherVideos.push(video);
            }
        });

        // Combine the two lists, with same-channel videos first
        return [...sameChannelVideos, ...otherVideos];

    }, [allVideos, currentVideoId, channelId]);

    if (isLoading) {
        return <p>Loading suggestions...</p>;
    }
    if (error) {
        return <p className="text-red-400">Could not load suggestions.</p>;
    }

    return (
        <div>
            <h3 className="font-bold mb-4">Up next</h3>
            <div className="space-y-3">
                {sortedVideos.length > 0 ? (
                    sortedVideos.map(video => (
                        <SuggestionCard key={video._id} video={video} />
                    ))
                ) : (
                    <p className="text-sm text-gray-400">No more videos to suggest.</p>
                )}
            </div>
        </div>
    );
}