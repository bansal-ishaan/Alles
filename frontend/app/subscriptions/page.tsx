'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serverUrl } from '@/lib/constants';
import { SubscribedChannel, ApiResponse } from '../types';
import { formatTimeAgo, formatDuration, formatViews } from '@/lib/utils';
import Link from 'next/link';

import { MdSubscriptions, MdOutlineVideoLibrary } from 'react-icons/md';
import { IoMdNotificationsOutline } from 'react-icons/io';

export default function SubscriptionsPage() {
  const { isLoggedIn } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscribedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribing, setUnsubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      setSubscriptions([]);
      setLoading(false);
      return;
    }

    fetchSubscriptions();
  }, [isLoggedIn]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Get current user ID first
      const meResponse = await fetch(`${serverUrl}/api/v1/users/current-user`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!meResponse.ok) {
        throw new Error('Failed to get current user');
      }

      const meData = await meResponse.json();
      const myUserId = meData.data._id;

      // Fetch subscriptions
      const subResponse = await fetch(`${serverUrl}/api/v1/subscriptions/u/${myUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!subResponse.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const result: ApiResponse<SubscribedChannel[]> = await subResponse.json();
      setSubscriptions(result.data || []);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (channelId: string) => {
    try {
      setUnsubscribing(channelId);
      
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch(`${serverUrl}/api/v1/subscriptions/c/${channelId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      // Remove from local state
      setSubscriptions(prev => prev.filter(sub => sub.subscribedChannel._id !== channelId));
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setUnsubscribing(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <div className="text-center">
          <MdSubscriptions className="text-6xl mx-auto mb-4 text-gray-400" />
          <h1 className="text-2xl font-bold mb-2">Sign in to see your subscriptions</h1>
          <p className="text-gray-400 mb-6">Sign in to see channels you&apos;re subscribed to</p>
          <Link 
            href="/auth" 
            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] text-white flex items-center justify-center">
        <div className="text-center">
          <MdSubscriptions className="text-6xl mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={fetchSubscriptions}
            className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white pt-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscriptions</h1>
          <p className="text-gray-400">
            {subscriptions.length === 0 
              ? "You haven\u2019t subscribed to any channels yet"
              : `${subscriptions.length} channel${subscriptions.length === 1 ? '' : 's'}`
            }
          </p>
        </div>

        {subscriptions.length === 0 ? (
          <div className="text-center py-16">
            <MdSubscriptions className="text-8xl mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-bold mb-4">No subscriptions yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              When you subscribe to channels, their latest videos will appear here
            </p>
            <Link 
              href="/" 
              className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors"
            >
              Explore Videos
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {subscriptions.map(({ subscribedChannel }) => (
              <div key={subscribedChannel._id} className="bg-[#1F1F1F] rounded-xl overflow-hidden hover:bg-[#2A2A2A] transition-colors">
                {/* Channel Info */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <Link href={`/${subscribedChannel.username}`}>
                      <img
                        src={subscribedChannel.avatar.url}
                        alt={subscribedChannel.fullName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/${subscribedChannel.username}`}>
                        <h3 className="font-semibold text-white hover:text-gray-300 transition-colors truncate">
                          {subscribedChannel.fullName}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-400 truncate">
                        @{subscribedChannel.username}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUnsubscribe(subscribedChannel._id)}
                      disabled={unsubscribing === subscribedChannel._id}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {unsubscribing === subscribedChannel._id ? 'Unsubscribing...' : 'Unsubscribe'}
                    </button>
                    <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                      <IoMdNotificationsOutline size={18} />
                    </button>
                  </div>
                </div>

                {/* Latest Video */}
                {subscribedChannel.latestVideo ? (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Latest Video</h4>
                    <Link href={`/watch/${subscribedChannel.latestVideo._id}`}>
                      <div className="relative aspect-video w-full mb-3">
                        <img
                          src={subscribedChannel.latestVideo.thumbnail.url}
                          alt={subscribedChannel.latestVideo.title}
                          className="rounded-lg object-cover w-full h-full"
                        />
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                          {formatDuration(subscribedChannel.latestVideo.duration)}
                        </span>
                      </div>
                      <h5 className="font-medium text-white hover:text-gray-300 transition-colors line-clamp-2 mb-2">
                        {subscribedChannel.latestVideo.title}
                      </h5>
                      <div className="flex items-center text-sm text-gray-400">
                        <span>{formatViews(subscribedChannel.latestVideo.views)} views</span>
                        <span className="mx-1.5">•</span>
                        <span>{formatTimeAgo(subscribedChannel.latestVideo.createdAt)}</span>
                      </div>
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <MdOutlineVideoLibrary className="text-4xl mx-auto mb-2 text-gray-600" />
                    <p className="text-sm text-gray-400">No videos yet</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}