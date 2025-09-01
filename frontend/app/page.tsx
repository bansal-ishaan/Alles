'use client';

import { useState, useEffect} from 'react';
import VideoCard from "./components/VideoCard";
import VideoSkeleton from "./components/ui/VideoSkeleton"; 
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
    toggleSidebar(); 
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


  useEffect(() => {
    const getCurrentUserId = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoggedInUserId(null);
        return;
      }
      try {
        const response = await fetch(
          `${serverUrl}/api/v1/users/current-user`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const result = await response.json();
          setLoggedInUserId(result.data._id);
        }
      } catch (error) {
        console.error("Could not fetch current user for HomePage:", error);
      }
    };

    getCurrentUserId();
  }, []);

  if (error) {
    return <p className="text-center mt-8 text-red-400">Error: {error}</p>;
  }

  return (
    <div>
      <TagsBar />
      
      {isLoading ? (
        <VideoSkeleton />
      ) : (
        <div className="p-4 md:p-6">
          
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