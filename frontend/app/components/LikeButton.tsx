
'use client';

import { ThumbsUp } from 'lucide-react';
import { formatViews } from '@/lib/utils';

interface LikeButtonProps {
  videoId: string;
  initialLikesCount: number;
  initialIsLiked: boolean;
  isDisliked: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function LikeButton({
  initialLikesCount,
  initialIsLiked,
  disabled = false,
  onClick,
}: LikeButtonProps) {
  const buttonClasses = initialIsLiked ? 'bg-gray-700' : 'bg-gray-800';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 pl-4 pr-3 py-2 hover:bg-gray-700 rounded-l-full text-sm font-semibold transition-colors ${buttonClasses} disabled:opacity-50`}
    >
      <ThumbsUp size={16} fill={initialIsLiked ? 'currentColor' : 'none'} />
      {formatViews(initialLikesCount)}
    </button>
  );
}