'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import { serverUrl } from '@/lib/constants';
import GoogleLoginFallbackModal from './GoogleLoginFallbackModal'; // We will reuse the modal

const apiClient = axios.create({
  baseURL: serverUrl,
  withCredentials: true,
});

// This is the core logic component. It must be wrapped in Suspense.
function AuthHandler() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isFinalizing, setIsFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isGoogleAuthPending = searchParams.get('google_auth') === 'pending';

    if (isGoogleAuthPending) {
      setIsFinalizing(true);

      const finalize = async () => {
        try {
          const response = await apiClient.get('/api/v1/users/google/finalize');
          console.log("Google login finalization response:", response);
          const data = response.data?.data;
          if (!data) {
            throw new Error('No data received from the server.');
          }

          if (data && data.accessToken) {
            login(data.accessToken);
            setIsFinalizing(false);
            router.replace('/');
          } else {
            throw new Error('Token was not found in the response.');
          }
        } catch (err: unknown) {
          if(err instanceof Error) {
            console.error("Google login finalization failed:", err);
            router.replace('/');
          }
          else {
            console.error("An unexpected error occurred during Google login finalization:", err);
          }
        }
      };

      finalize();
    }
  }, [searchParams, router, login]);

  const closeModal = () => {
    setIsFinalizing(false);
    setError(null);
  };

  if (!isFinalizing) {
    return null; // Don't render anything if not in the process of finalizing
  }

  // Render the modal using its own state
  return <GoogleLoginFallbackModal error={error} onClose={closeModal} />;
}


// This is the exported component. It provides the required Suspense boundary.
export default function GoogleAuthHandler() {
  return (
    <Suspense fallback={null}>
        <AuthHandler />
    </Suspense>
  )
}