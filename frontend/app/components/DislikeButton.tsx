import { ThumbsDown } from 'lucide-react';
import { formatViews } from '@/lib/utils';

interface DislikeButtonProps {
  videoId: string;
  initialDislikesCount: number;
  initialIsDisliked: boolean;
  isLiked: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export default function DislikeButton({
  initialDislikesCount,
  initialIsDisliked,
  disabled = false,
  onClick,
}: DislikeButtonProps) {
  const buttonClasses = initialIsDisliked ? 'bg-gray-700' : 'bg-gray-800';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 hover:bg-gray-700 rounded-r-full text-sm font-semibold transition-colors ${buttonClasses} disabled:opacity-50`}
    >
      <ThumbsDown size={16} fill={initialIsDisliked ? 'currentColor' : 'none'} />
      {formatViews(initialDislikesCount)}
    </button>
  );
} 