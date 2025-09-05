
'use client';

import { useState, useEffect} from 'react';
import VideoCard from "./components/VideoCard";
import VideoSkeleton from "./components/ui/VideoSkeleton"; // Import the skeleton
import type { Video } from './types'; 
import { serverUrl } from '@/lib/constants'; 
import TagsBar from "./components/TagsBar";
import {useAuth} from './context/AuthContext';

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toggleSidebar } = useAuth(); 

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
    toggleSidebar(); // Ensure sidebar is always open when this page loads
  },[]);

  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${serverUrl}/api/v1/video`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch videos.');
        }

        setVideos(result.data.docs || []);
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

    fetchVideos();
  }, []);

  if (error) {
    return <p className="text-center mt-8 text-red-400">Error: {error}</p>;
  }

  return (
    <div>
      <TagsBar />
      
      {/* Use the isLoading state to conditionally render the skeleton */}
      {isLoading ? (
        <VideoSkeleton />
      ) : (
        <div className="p-4 md:p-6">
          {/* 
            MOBILE UI & RESPONSIVE GRID:
            - 1 column on mobile (default)
            - 2 columns on small screens (sm: 640px and up)
            - 3 columns on medium screens (md: 768px and up)
          */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
            {videos.length > 0 ? (
              videos.map((video) => (
                <VideoCard key={video._id} video={video} loggedInUserId = {loggedInUserId} />
              ))
            ) : (
              <p className="col-span-full text-center mt-8 text-gray-400">
                No videos found for this filter.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}