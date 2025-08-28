'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { serverUrl } from '@/lib/constants';
import TweetComposer from '../components/TweetComposer';
import TweetItem, { TweetItemData } from '../components/TweetItem';
import { useAuth } from '../context/AuthContext';

// Typing for the /current-user API response
interface MeResponse {
  data?: {
    _id: string;
    username: string;
  };
}

// Typing for the /tweet API response
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

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tweetsPerPage = 10;

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const fetchMe = useCallback(async (): Promise<{ _id: string; username: string } | null> => {
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

      return (data?.data || []).map((t: TweetResponse) => ({
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
      setCurrentPage(1); // ✅ Reset to page 1 on reload
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
      <div className="max-w-xl mx-auto mt-6 p-4 border rounded bg-gray-900 text-white">
        <p>Please login to view and post tweets.</p>
      </div>
    );
  }

  // ✅ Pagination calculation
  const indexOfLastTweet = currentPage * tweetsPerPage;
  const indexOfFirstTweet = indexOfLastTweet - tweetsPerPage;
  const currentTweets = tweets.slice(indexOfFirstTweet, indexOfLastTweet);
  const totalPages = Math.ceil(tweets.length / tweetsPerPage);

  return (
    <div className="max-w-xl mx-auto px-3 py-4 flex flex-col gap-4 bg-gray-900 min-h-screen text-white">
      <TweetComposer onCreated={load} />

      {/* Toggle Buttons */}
      <div className="flex justify-center gap-2 mb-3">
        <button
          onClick={() => setShowAll(true)}
          className={`px-3 py-1 rounded ${
            showAll ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
          }`}
        >
          All Tweets
        </button>
        <button
          onClick={() => setShowAll(false)}
          className={`px-3 py-1 rounded ${
            !showAll ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'
          }`}
        >
          My Tweets
        </button>
      </div>

      {loading && <p className="text-center text-gray-400">Loading…</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && tweets.length === 0 && (
        <p className="text-center text-gray-400">No tweets yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {currentTweets.map((t) => (
          <TweetItem
            key={t._id}
            tweet={t}
            canEdit={showAll ? t.ownerId === me?._id : true}
            onChanged={load}
          />
        ))}
      </div>

      {/* ✅ Pagination Controls */}
      {tweets.length > tweetsPerPage && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TweetsPage;
