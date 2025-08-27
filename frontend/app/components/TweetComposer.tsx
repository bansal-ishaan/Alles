'use client';

import React, { useState } from 'react';
import { serverUrl } from '@/lib/constants';

interface TweetComposerProps {
  onCreated: () => void;
}

const TweetComposer: React.FC<TweetComposerProps> = ({ onCreated }) => {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');

      const res = await fetch(`${serverUrl}/api/v1/tweet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to create tweet');
      }

      setContent('');
      onCreated();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="w-full border rounded-lg p-3 bg-black text-white"
    >
      <textarea
        className="w-full resize-none outline-none text-white placeholder-gray-500"
        placeholder="What's happening?"
        maxLength={280}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm text-gray-500">{content.length}/280</span>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="px-4 py-1.5 rounded-md bg-blue-600 text-white disabled:opacity-50"
        >
          {submitting ? 'Posting…' : 'Tweet'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </form>
  );
};

export default TweetComposer;
