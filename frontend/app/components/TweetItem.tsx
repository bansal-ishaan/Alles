'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Heart } from 'lucide-react';
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

  return (
    <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 shadow-sm text-gray-100">
      {/* User Info */}
      <div className="flex items-center gap-3 mb-2">
        {tweet.ownerDetails?.avatar?.url && (
          <img
            src={tweet.ownerDetails.avatar.url}
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <span className="font-semibold">{tweet.ownerDetails?.username}</span>
        <span className="text-gray-400 text-sm ml-auto">
          {new Date(tweet.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Tweet Content */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="border border-gray-600 rounded p-2 w-full bg-gray-700 text-gray-100"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              disabled={busy || !newContent.trim()}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setNewContent(tweet.content);
              }}
              className="bg-gray-600 text-gray-200 px-3 py-1 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{tweet.content}</p>
      )}

      {/* Actions */}
      <div className="flex gap-4 mt-3 items-center">
        <button
  onClick={async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${serverUrl}/api/v1/likes/toggle/t/${tweet._id}`, {
        method: 'POST',
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle like');
      onChanged?.(); // refresh parent after like/unlike
    } catch (err) {
      console.error(err);
      alert('Failed to like/unlike tweet');
    }
  }}
  className={`flex items-center gap-1 transition ${
    tweet.isLiked ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
  }`}
>
  <Heart size={16} fill={tweet.isLiked ? 'currentColor' : 'none'} />{' '}
  {tweet.likesCount || 0}
</button>


        {canEdit && !editing && (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 text-blue-400 hover:text-blue-500"
            >
              <Pencil size={16} /> Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-red-500 hover:text-red-600"
            >
              <Trash2 size={16} /> Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TweetItem;