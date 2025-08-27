const VideoCardSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Skeleton for the video thumbnail */}
      <div className="bg-gray-700 rounded-xl h-40 md:h-52"></div>
      <div className="mt-2 flex items-start space-x-2">
        {/* Skeleton for the avatar */}
        <div className="bg-gray-700 rounded-full h-10 w-10"></div>
        <div className="flex-1 space-y-2 py-1">
          {/* Skeleton for the video title */}
          <div className="bg-gray-700 rounded h-4"></div>
          <div className="space-y-1">
            {/* Skeleton for the channel name */}
            <div className="bg-gray-700 rounded h-3 w-3/4"></div>
            {/* Skeleton for views and date */}
            <div className="bg-gray-700 rounded h-3 w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCardSkeleton;