'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Heart, MessageCircle } from 'lucide-react';
import { serverUrl } from '@/lib/constants';

export interface TweetItemData {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  ownerId: string;
  ownerDetails?: {
    username: string;
    avatar?: { url: string };
  };
  likesCount?: number;
  isLiked?: boolean;
}

interface TweetItemProps {
  tweet: TweetItemData;
  canEdit: boolean;
  onChanged?: () => void;
}

const TweetItem: React.FC<TweetItemProps> = ({ tweet, canEdit, onChanged }) => {
  const [editing, setEditing] = useState(false);
  const [newContent, setNewContent] = useState(tweet.content);
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tweet?')) return;
    setBusy(true);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${serverUrl}/api/v1/tweet/${tweet._id}`, {
        method: 'DELETE',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Failed to delete tweet');
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async () => {
    setBusy(true);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${serverUrl}/api/v1/tweet/${tweet._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content: newContent }),
        credentials: 'include',
      });
      setEditing(false);
      onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Failed to update tweet');
    } finally {
      setBusy(false);
    }
  };
  
  const handleLike = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${serverUrl}/api/v1/likes/toggle/t/${tweet._id}`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle like');
      onChanged?.();
    } catch (err) {
      console.error(err);
      alert('Failed to like/unlike tweet');
    }
  };

  return (
    <div className="flex space-x-3 p-4 border-b border-gray-700">
      <img
        src={tweet.ownerDetails?.avatar?.url || `https://avatar.vercel.sh/${tweet.ownerDetails?.username}.png`}
        alt="avatar"
        className="w-10 h-10 rounded-full object-cover"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-white">{tweet.ownerDetails?.username}</span>
            <span className="text-gray-500 ml-2">@{tweet.ownerDetails?.username}</span>
            <span className="text-gray-500 mx-2">·</span>
            <span className="text-gray-500 text-sm">
              {new Date(tweet.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        {editing ? (
          <div>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg p-2 mt-2"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={handleUpdate} disabled={busy} className="px-4 py-2 bg-blue-500 rounded-full text-white">Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 bg-gray-600 rounded-full text-white">Cancel</button>
            </div>
          </div>
        ) : (
          <p className="text-white mt-2 whitespace-pre-wrap">{tweet.content}</p>
        )}

        <div className="flex items-center justify-between mt-4 text-gray-500">
            <div className="flex items-center space-x-1 group">
                <MessageCircle size={18} className="group-hover:text-blue-500" />
                <span className="group-hover:text-blue-500">0</span>
            </div>
            <button onClick={handleLike} className={`flex items-center space-x-1 group ${tweet.isLiked ? 'text-red-500' : ''}`}>
              <Heart size={18} className="group-hover:text-red-500" fill={tweet.isLiked ? 'currentColor' : 'none'}/>
              <span className="group-hover:text-red-500">{tweet.likesCount || 0}</span>
            </button>
            {canEdit && !editing && (
              <>
                <button onClick={() => setEditing(true)} className="flex items-center space-x-1 group">
                  <Pencil size={18} className="group-hover:text-green-500" />
                  <span className="group-hover:text-green-500">Edit</span>
                </button>
                <button onClick={handleDelete} className="flex items-center space-x-1 group">
                  <Trash2 size={18} className="group-hover:text-red-500" />
                  <span className="group-hover:text-red-500">Delete</span>
                </button>
              </>
            )}
        </div>
      </div>
    </div>
  );
};

export default TweetItem;