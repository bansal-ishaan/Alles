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
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-6 min-h-screen text-white bg-#0a0a0a">
      {/* Tweet Composer */}
      <div className="mb-6">
        <TweetComposer onCreated={load} />
      </div>

      {/* Toggle Buttons */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setShowAll(true)}
          className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all ${
            showAll
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Tweets
        </button>
        <button
          onClick={() => setShowAll(false)}
          className={`px-5 py-2.5 rounded-full text-sm sm:text-base font-semibold transition-all ${
            !showAll
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          My Tweets
        </button>
      </div>

      {/* Loading / Error / Empty */}
      {loading && <p className="text-center text-gray-400">Loading…</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      {!loading && !error && tweets.length === 0 && (
        <p className="text-center text-gray-500">No tweets yet.</p>
      )}

      {/* Tweets Feed */}
      <div className="flex flex-col gap-4">
        {currentTweets.map((t) => (
          <div
            key={t._id}
            className="bg-gray-900/80 rounded-2xl p-4 shadow-md hover:shadow-lg hover:bg-gray-800/80 transition duration-200"
          >
            <TweetItem
              tweet={t}
              canEdit={showAll ? t.ownerId === me?._id : true}
              onChanged={load}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {tweets.length > tweetsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-800 rounded-full text-sm disabled:opacity-40 hover:bg-gray-700 transition"
          >
            Prev
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-800 rounded-full text-sm disabled:opacity-40 hover:bg-gray-700 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TweetsPage;
