// // app/page.tsx

// // Reverted to a Server Component for performance and SEO
// import VideoCard from "./components/VideoCard";
// import TagsBar from "./components/TagsBar";
// import type { Video } from './types';

// interface HomeProps {
//     searchParams: {
//         query?: string;
//         sortBy?: string;
//     };
// }

// // The data fetching function now accepts the filter parameters
// async function getVideos({ query, sortBy }: { query?: string, sortBy?: string }): Promise<Video[]> {
//     // Build the query string for the API call
//     const params = new URLSearchParams();
//     if (query && query !== 'All') {
//         params.append('query', query);
//     }
//     if (sortBy) {
//         params.append('sortBy', sortBy);
//         params.append('sortType', 'desc'); // Default to descending for views, likes, etc.
//     }

//     const apiUrl = `http://localhost:3000/api/v1/video/?${params.toString()}`;

//     try {
//         const response = await fetch(apiUrl, { cache: 'no-store' });
//         if (!response.ok) {
//             console.error("API Error:", await response.text());
//             return [];
//         }
//         const result = await response.json();
//         return result.data.docs || [];
//     } catch (error) {
//         console.error("Fetch Error:", error);
//         return [];
//     }
// }

// export default async function HomePage({ searchParams }: HomeProps) {
//     // Pass the searchParams from the URL to the data fetching function
//     const videos: Video[] = await getVideos(searchParams);

//     return (
//         <div>
//             {/* The TagsBar is a Client Component, but it can be used in a Server Component */}
//             <TagsBar />
            
//             <div className="p-4 md:p-6">
//                 {/* Updated grid to show 3 videos on large screens */}
//                 <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
//                     {videos.length > 0 ? (
//                         videos.map((video) => (
//                             <VideoCard key={video._id} video={video} />
//                         ))
//                     ) : (
//                         <p className="col-span-full text-center mt-8 text-gray-400">
//                             No videos found for this filter.
//                         </p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }




















// // 1. THIS IS THE MOST IMPORTANT CHANGE.
// // It converts this page from a Server Component to a Client Component.
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
                <VideoCard key={video._id} video={video} />
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