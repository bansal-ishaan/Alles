'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { serverUrl } from '@/lib/constants';
import TweetComposer from '../components/TweetComposer';
import TweetItem, { TweetItemData } from '../components/TweetItem';
import { useAuth } from '../context/AuthContext';

interface MeResponse {
  data?: {
    _id: string;
    username: string;
  };
}

interface TweetResponse {
  _id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerDetails: {
    _id: string;
    username: string;
  };
  likesCount?: number;
  isLiked?: boolean;
}

const TweetsPage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [tweets, setTweets] = useState<TweetItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<{ _id: string; username: string } | null>(null);
  const [showAll, setShowAll] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const tweetsPerPage = 10;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const fetchMe = useCallback(async () => {
    if (!isLoggedIn) return null;
    const res = await fetch(`${serverUrl}/api/v1/users/current-user`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data: MeResponse = await res.json();
    return data?.data || null;
  }, [isLoggedIn, token]);

  const fetchTweets = useCallback(
    async (userId: string): Promise<TweetItemData[]> => {
      const url = showAll
        ? `${serverUrl}/api/v1/tweet/all`
        : `${serverUrl}/api/v1/tweet/user/${userId}`;

      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to fetch tweets');
      }

      const data: { data?: TweetResponse[] } = await res.json();
      return (data?.data || []).map((t) => ({
        _id: t._id,
        content: t.content,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        ownerId: t.ownerId,
        ownerDetails: t.ownerDetails,
        likesCount: t.likesCount ?? 0,
        isLiked: t.isLiked ?? false,
      }));
    },
    [token, showAll]
  );

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const meData = await fetchMe();
      if (!meData) {
        setTweets([]);
        setMe(null);
        return;
      }
      setMe(meData);
      const items = await fetchTweets(meData._id);
      setTweets(items);
      setCurrentPage(1);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [fetchMe, fetchTweets]);

  useEffect(() => {
    load();
  }, [load, showAll]);

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-6 p-6 rounded-xl bg-gray-900/90 text-white text-center shadow-lg">
        <p className="text-lg font-medium">Please login to view and post tweets.</p>
      </div>
    );
  }

  const indexOfLastTweet = currentPage * tweetsPerPage;
  const indexOfFirstTweet = indexOfLastTweet - tweetsPerPage;
  const currentTweets = tweets.slice(indexOfFirstTweet, indexOfLastTweet);
  const totalPages = Math.ceil(tweets.length / tweetsPerPage);

 return (
    <div className="w-full max-w-2xl mx-auto border-l border-r border-gray-700 min-h-screen">
      <div className="sticky top-0 bg-black bg-opacity-80 backdrop-blur-md z-10 px-4 py-3">
        <h1 className="text-xl font-bold text-white">Home</h1>
      </div>
      
      <TweetComposer onCreated={load} />

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setShowAll(true)}
          className={`flex-1 p-4 text-center font-bold transition-colors ${showAll ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-800'}`}
        >
          For you
        </button>
        <button
          onClick={() => setShowAll(false)}
          className={`flex-1 p-4 text-center font-bold transition-colors ${!showAll ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:bg-gray-800'}`}
        >
          Your Tweets
        </button>
      </div>

      {loading && <p className="text-center text-gray-400 p-4">Loading tweets...</p>}
      {error && <p className="text-center text-red-500 p-4">{error}</p>}
      {!loading && !error && tweets.length === 0 && (
        <p className="text-center text-gray-500 p-4">No tweets to show.</p>
      )}

      <div>
        {currentTweets.map((t) => (
          <TweetItem
            key={t._id}
            tweet={t}
            canEdit={t.ownerId === me?._id}
            onChanged={load}
          />
        ))}
      </div>

      {tweets.length > tweetsPerPage && (
        <div className="flex justify-center items-center gap-4 py-4 border-t border-gray-700">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 rounded-full disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 rounded-full disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TweetsPage;
