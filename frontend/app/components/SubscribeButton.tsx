// app/components/SubscribeButton.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoMdNotificationsOutline } from 'react-icons/io';
import { serverUrl } from '@/lib/constants';

interface SubscribeButtonProps {
    channelId: string;
    initialSubscribedStatus: boolean;
}

export default function SubscribeButton({ channelId, initialSubscribedStatus }: SubscribeButtonProps) {
    const [isSubscribed, setIsSubscribed] = useState(initialSubscribedStatus);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleToggleSubscription = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/auth'); // Redirect to login if not authenticated
            return;
        }

        try {
            const response = await fetch(`${serverUrl}/api/v1/subscriptions/c/${channelId}`, {
                method: 'POST', // Assuming your toggle is a POST request
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                // Handle error (e.g., show a toast notification)
                console.error("Failed to toggle subscription");
            } else {
                // Toggle the state locally for instant UI feedback
                setIsSubscribed(prev => !prev);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={handleToggleSubscription}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-full font-semibold text-sm"
                >
                    Subscribed
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full">
                    <IoMdNotificationsOutline size={20} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleToggleSubscription}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-full font-semibold text-sm"
        >
            Subscribe
        </button>
    );
}