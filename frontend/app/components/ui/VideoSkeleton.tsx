import VideoCardSkeleton from './VideoCardSkeleton';

const VideoSkeleton = () => {
  return (
    <div className="p-4 md:p-6">
      {/* This grid should match the final grid for a seamless transition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
        {/* Render multiple skeleton cards to fill the screen */}
        {Array.from({ length: 9 }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export default VideoSkeleton;