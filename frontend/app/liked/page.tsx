// app/liked-videos/page.tsx

"use client";

import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import type { Video } from "../types"; // Using the final, clean Video type
import { useRouter } from "next/navigation";
import { serverUrl } from '@/lib/constants';

// --- THIS IS THE FIX ---
// 1. Define a specific type for the raw data from the '/likes/videos' API.
// It describes an object that contains a 'likedVideo' property.
interface LikedVideoItemFromAPI {
    likedVideo: {
        _id: string;
        title: string;
        thumbnail?: { url: string };
        videoFile?: { url: string };
        ownerDetails?: { // The backend nests this inside likedVideo
            _id: string;
            username: string;
            avatar?: { url: string };
        };
        views?: number;
        createdAt: string;
        duration?: number;
    }
}


export default function LikedVideosPage() { // Renamed component for clarity
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
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
    const fetchLikedVideos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("You must be logged in to see your liked videos.");
          router.push("/auth");
          return;
        }

        const res = await fetch(`${serverUrl}/api/v1/likes/videos`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.message || "Failed to fetch liked videos");
        }

        // 2. Use our new, specific type instead of 'any' to ensure type safety.
        const cleanedVideos: Video[] = (result.data || []).map((item: LikedVideoItemFromAPI) => {
          // The video data is nested inside the 'likedVideo' property
          const v = item.likedVideo; 
          
          return {
            _id: v._id,
            title: v.title,
            thumbnail: v.thumbnail || { url: v.videoFile?.url || "/default-thumbnail.png" },
            // The ownerDetails are already correctly nested by the backend aggregation
            ownerDetails: v.ownerDetails || { _id: "unknown", username: "Unknown User" },
            views: v.views || 0,
            createdAt: v.createdAt,
            duration: v.duration || 0,
          };
        });

        setVideos(cleanedVideos);

      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unexpected error occurred');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedVideos();
  }, [router]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">Liked Videos</h1>
      {isLoading ? (
        <div className="text-center text-gray-400">Loading your liked videos...</div>
      ) : error ? (
        <div className="text-red-400 text-center">{error}</div>
      ) : videos.length === 0 ? (
        <div className="text-gray-400 text-center">You havent liked any videos yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} loggedInUserId={loggedInUserId} />
          ))}
        </div>
      )}
    </div>
  );
}