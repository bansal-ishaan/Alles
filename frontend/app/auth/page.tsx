'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { serverUrl } from '@/lib/constants';

import GoogleLoginButton from '../components/GoogleLoginButton'; 

export default function AuthPage() {
    const { login } = useAuth();
    const router = useRouter();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // No changes are needed in your existing handleLogin, handleSignup,
    // or handleSubmit functions. They will continue to work perfectly for the manual forms.
    const handleLogin = async () => {
        const response = await fetch(`${serverUrl}/api/v1/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Login failed.');
        }
        
        const token = result.data.accessToken;
        login(token); 
        router.push('/');
    };

    const handleSignup = async () => {
        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        if (avatar) formData.append('avatar', avatar);
        if (coverImage) formData.append('coverImage', coverImage);
        
        const response = await fetch(`${serverUrl}/api/v1/users/register`, {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Signup failed.');
        }
        
        setSuccessMessage('Account created successfully! Please log in.');
        setIsLoginMode(true);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isLoginMode) {
                await handleLogin();
            } else {
                await handleSignup();
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError("Either the email or password is incorrect. Please try again.");
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLoginMode(!isLoginMode);
        setError(null);
        setSuccessMessage(null);
    }
    
    return (
        <div className="max-w-md mx-auto mt-12 p-8 border border-gray-700 rounded-lg bg-gray-900 text-white">
            <h1 className="text-2xl font-bold text-center mb-6">{isLoginMode ? 'Login to Your Account' : 'Create an Account'}</h1>
            
            {/* Manual Login/Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                {!isLoginMode && (
                    <>
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-2 mt-1 bg-gray-800 border border-gray-600 rounded" required name="fullName" autoComplete="name" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Username</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-2 mt-1 bg-gray-800 border border-gray-600 rounded" required name="username" autoComplete="username" />
                        </div>
                    </>
                )}
                <div>
                    <label className="text-sm font-medium">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 mt-1 bg-gray-800 border border-gray-600 rounded" required name="email" autoComplete="email" />
                </div>
                <div>
                    <label className="text-sm font-medium">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mt-1 bg-gray-800 border border-gray-600 rounded" required name="password" autoComplete={isLoginMode ? "current-password" : "new-password"} />
                </div>
                {!isLoginMode && (
                    <>
                        <div>
                            <label className="text-sm font-medium">Avatar (Required)</label>
                            <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 text-gray-300 hover:file:bg-gray-600" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Cover Image (Optional)</label>
                            <input type="file" accept="image/*" onChange={(e) => setCoverImage(e.target.files?.[0] || null)} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-gray-700 text-gray-300 hover:file:bg-gray-600" />
                        </div>
                    </>
                )}
                <button type="submit" disabled={isLoading} className="w-full p-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed">
                    {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Create Account')}
                </button>
            </form>

            {/* 2. Add a visual separator and the Google button */}
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-600"></div>
                <span className="mx-4 text-xs font-semibold text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-600"></div>
            </div>

            <div className="w-full">
                <GoogleLoginButton />
            </div>

            {/* Error and Success Messages */}
            {error && <p className="mt-4 text-center text-sm text-red-400 bg-red-900/50 p-3 rounded">{error}</p>}
            {successMessage && <p className="mt-4 text-center text-sm text-green-400 bg-green-900/50 p-3 rounded">{successMessage}</p>}
            
            {/* Toggle between Login and Signup modes */}
            <p className="mt-6 text-center text-sm text-gray-400">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                <button onClick={toggleMode} className="ml-1 font-semibold text-blue-400 hover:underline">
                    {isLoginMode ? 'Sign Up' : 'Login'}
                </button>
            </p>
        </div>
    );
}