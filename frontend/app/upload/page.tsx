
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext'; // 1. IMPORT THE AUTH HOOK
import { serverUrl } from '@/lib/constants';

export default function UploadVideoPage() {
    const { isLoggedIn } = useAuth(); // 2. GET THE LOGGED-IN STATE
    const router = useRouter();

    // State for the form inputs
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 3. PROTECT THE ROUTE
    // If the user is not logged in, redirect them to the auth page.
    useEffect(() => {
        // This check runs after the AuthProvider has determined the auth state.
        if (isLoggedIn === false) {
            router.push('/auth');
        }
    }, [isLoggedIn, router]);

    // Main function to handle the form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        // Client-side validation
        if (!title || !description || !videoFile || !thumbnailFile) {
            setError('All fields, including video and thumbnail, are required.');
            setIsLoading(false);
            return;
        }

        // 4. GET THE TOKEN FROM LOCAL STORAGE (as before)
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setError('Authentication error. Please log in again.');
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('videoFile', videoFile);
        formData.append('thumbnail', thumbnailFile);

        try {
            const response = await fetch(`${serverUrl}/api/v1/video/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An unknown error occurred during upload.');
            }

            setSuccessMessage(result.message || 'Video uploaded successfully!');

            // Redirect to the newly created video's watch page
            setTimeout(() => {
                // The created video object should be in result.data
                const newVideoId = result.data?._id;
                if (newVideoId) {
                    router.push(`/watch/${newVideoId}`);
                } else {
                    router.push('/'); // Fallback to home page
                }
            }, 2000);

        } catch (err: unknown) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unexpected error occurred');
  }
}
 finally {
            setIsLoading(false);
        }
    };
    
    // While the context is determining auth state, or if user is not logged in, show a loader/message
    if (isLoggedIn === false) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Redirecting to login...</p>
            </div>
        );
    }
    
    // 5. TAILWIND STYLING FOR THE FORM
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-8">
                <h1 className="text-2xl font-bold mb-6">Upload a New Video</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            id="description"
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="videoFile" className="block text-sm font-medium mb-1">Video File</label>
                            <input
                                id="videoFile"
                                type="file"
                                accept="video/*"
                                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="thumbnail" className="block text-sm font-medium mb-1">Thumbnail Image</label>
                            <input
                                id="thumbnail"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                                required
                            />
                        </div>
                    </div>
                    
                    {/* UI Feedback Messages */}
                    {error && <p className="text-center text-sm text-red-400 bg-red-900/50 p-3 rounded">{error}</p>}
                    {successMessage && <p className="text-center text-sm text-green-400 bg-green-900/50 p-3 rounded">{successMessage}</p>}

                    <button type="submit" disabled={isLoading} className="w-full p-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                        {isLoading ? 'Uploading...' : 'Publish Video'}
                    </button>
                </form>
            </div>
        </div>
    );
}