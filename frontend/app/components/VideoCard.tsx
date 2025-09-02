
"use client"; 

import Link from "next/link";
import type { Video } from "../types";
import { formatTimeAgo, formatDuration } from "@/lib/utils";
import Image from "next/image";

export default function VideoCard({ video , loggedInUserId}: { video: Video , loggedInUserId: string | null}) {
  const isOwner = loggedInUserId && loggedInUserId === video.ownerDetails._id;
  const channelLink = isOwner ? "/profile" : `/${video.ownerDetails.username}`;

  const avatarUrl = video.ownerDetails?.avatar?.url || "/default-avatar.png";
  const username = video.ownerDetails?.username || "Unknown User";

  return (
    <div className="flex flex-col gap-2">
      {/* Main link to the watch page */}
      <Link href={`/watch/${video._id}`}>
        <div className="relative aspect-video w-full">
          {/* We are still using the regular <img> tag to avoid next.config issues */}
          <Image
            src={video.thumbnail.url}
            alt={video.title}
            width={600}
            height={400}
            className="rounded-xl object-cover w-full h-full group-hover:rounded-none transition-all duration-200"
          />
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
        </div>
      </Link>

      {/* Details section */}
      <div className="flex gap-3 mt-2">
        <Link href={channelLink}>
          <img
            src={avatarUrl}
            alt={username}
            className="rounded-full bg-gray-700 w-9 h-9 object-cover"
          />
        </Link>

        <div className="flex flex-col">
          <Link href={`/watch/${video._id}`}>
            <h3 className="font-bold text-md leading-snug line-clamp-2 hover:text-gray-300">
              {video.title}
            </h3>
          </Link>
          <Link href={channelLink}>
            <p className="text-sm text-gray-400 mt-1 hover:text-white">
              {username}
            </p>
          </Link>
          <div className="flex items-center text-sm text-gray-400">
            <span>{video.views || 0} views</span>
            <span className="mx-1.5">•</span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
