
"use client";

import { useEffect, useState } from "react";
import VideoCard from "../components/VideoCard";
import type { Video } from "../types"; 
import { useRouter } from "next/navigation";
import { serverUrl } from '@/lib/constants';

interface HistoryVideoFromAPI {
    _id: string;
    title: string;
    thumbnail?: { url: string }; 
    videoFile?: { url: string }; 
    ownerDetails?: { 
        _id: string;
        username: string;
        avatar?: { url: string };
    };
    owner?: { 
        _id: string;
        username: string;
        avatar?: { url: string };
    };
    views?: number;
    createdAt: string;
    duration?: number;
}


export default function HistoryPage() {
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
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("You need to sign in to access this feature.");
          
          router.push("/auth");
          return;
        }

        const res = await fetch(`${serverUrl}/api/v1/users/history`, { 
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const result = await res.json();
        
        if (!res.ok) {
            throw new Error(result.message || "Failed to fetch watch history");
        }

        
        const cleanedVideos: Video[] = (result.data || []).map((v: HistoryVideoFromAPI) => ({
          _id: v._id,
          title: v.title,
          // Safely determine the thumbnail URL
          thumbnail: v.thumbnail || { url: v.videoFile?.url || "/default-thumbnail.png" }, 
          // Safely determine the owner details and ensure it matches the 'Video' type
          ownerDetails: v.ownerDetails || v.owner || { _id: "unknown", username: "Unknown User" },
          views: v.views || 0,
          createdAt: v.createdAt,
          duration: v.duration || 0,
        }));

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

    fetchHistory();
  }, [router]); // router should be in the dependency array

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Watch History</h1>
      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-400 whitespace-pre-line">{error}</div>
      ) : videos.length === 0 ? (
        <div className="text-gray-400">No watch history found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} loggedInUserId={loggedInUserId} />
          ))}
        </div>
      )}
    </div>
  );
}