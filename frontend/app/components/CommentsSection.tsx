// app/components/CommentsSection.tsx

'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThumbsUp, ThumbsDown, MoreVertical } from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { serverUrl } from '@/lib/constants';
// --- Define Types ---
interface CurrentUser {
    _id: string;
    username: string;
    avatar?: { url: string };
}
interface CommentOwner {
    username: string;
    fullName: string;
    avatar?: { url: string }; // Mark as optional to be safe
}
interface Comment {
    _id: string;
    content: string;
    owner: CommentOwner;
    likesCount: number;
    isLiked: boolean;
    createdAt: string;
}

// --- Single Comment Card Component (WITH THE FIX) ---
function CommentCard({ comment }: { comment: Comment }) {
    const avatarUrl = comment.owner?.avatar?.url || '/default-avatar.png';
    const username = comment.owner?.username || 'Unknown User';

    return (
        <div className="flex items-start gap-3">
            <Link href={`/${username}`}>
                <img 
                    src={avatarUrl} 
                    alt={username} 
                    className="w-10 h-10 rounded-full bg-gray-700 object-cover" 
                />
            </Link>
            <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                    <Link href={`/${username}`} className="font-semibold">@{username}</Link>
                    <span className="text-gray-400">{formatTimeAgo(comment.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
                <div className="flex items-center gap-4 mt-2">
                    <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"><ThumbsUp size={14} /> {comment.likesCount}</button>
                    <button className="text-xs text-gray-400 hover:text-white"><ThumbsDown size={14} /></button>
                    <button className="text-xs font-semibold text-gray-400 hover:text-white">Reply</button>
                </div>
            </div>
            <button className="text-gray-400 hover:text-white"><MoreVertical size={16} /></button>
        </div>
    );
}


// --- Main Comments Section Component ---
export default function CommentsSection({ videoId }: { videoId: string }) {
    const { isLoggedIn } = useAuth();
    const router = useRouter();



    const [comments, setComments] = useState<Comment[]>([]);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [newComment, setNewComment] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

            try {
                const [commentsRes, currentUserRes] = await Promise.all([
                    
                    fetch(`${serverUrl}/api/v1/comment/${videoId}`, { headers }),
                    isLoggedIn ? fetch(`${serverUrl}/api/v1/users/current-user`, { headers }) : Promise.resolve(null)
                ]);

                if (commentsRes.ok) {
                    const result = await commentsRes.json();
                    setComments(result.data.docs || []);
                } else {
                    console.error("Failed to fetch comments:", await commentsRes.text());
                }

                if (currentUserRes && currentUserRes.ok) {
                    const result = await currentUserRes.json();
                    setCurrentUser(result.data);
                }

            } catch (err: unknown) {
               if (err instanceof Error) {
                setError(err.message);
               }
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [videoId, isLoggedIn]);

    const handleAddComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !isLoggedIn) {
            if (!isLoggedIn) router.push('/auth');
            return;
        }
        
        const token = localStorage.getItem('accessToken');
        
        try {
            const res = await fetch(`${serverUrl}/api/v1/comment/${videoId}`, { // Plural "comments"
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: newComment })
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            const newlyAddedComment: Comment = {
                ...result.data,
                owner: {
                    username: currentUser?.username || 'You',
                    
                    avatar: { url: currentUser?.avatar?.url || '/default-avatar.png' } 
                },
                likesCount: 0,
                isLiked: false,
            };
            
            setComments(prev => [newlyAddedComment, ...prev]);
            setNewComment("");
        } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unexpected error occurred');
  }
}

    };

    return (
        <div className="mt-6">
            <h2 className="text-lg font-bold mb-4">{comments.length} Comments</h2>

            {isLoggedIn && (
                 <form onSubmit={handleAddComment} className="flex items-start gap-3 mb-8">
                    {currentUser?.avatar?.url ? (
                        <img src={currentUser.avatar.url} alt="your avatar" className="w-10 h-10 rounded-full object-cover"/>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                    )}
                    <div className="flex-1">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full bg-transparent border-b border-gray-600 focus:border-white outline-none pb-1"
                        />
                        {newComment && (
                            <div className="text-right mt-2 space-x-2">
                                <button type="button" onClick={() => setNewComment('')} className="px-4 py-2 bg-gray-700 rounded-full text-sm font-semibold">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 rounded-full text-sm font-semibold">Comment</button>
                            </div>
                        )}
                    </div>
                </form>
            )}

            {isLoading && <p>Loading comments...</p>}
            {error && <p className="text-red-400 mt-4">Error: {error}</p>}
            <div className="space-y-6">
                {comments.map(comment => (
                    <CommentCard key={comment._id} comment={comment} />
                ))}
            </div>
        </div>
    );
}