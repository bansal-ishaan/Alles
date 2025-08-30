

  'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { serverUrl } from '@/lib/constants'; 
import { Hash, Plus, Compass, LogIn } from 'lucide-react';

interface JoinedRoom {
    _id: string;
    name: string;
    roomId: string;
    memberCount: number;
}

interface CurrentUser {
    _id: string;
    username: string;
    avatar?: { url: string };
}

export default function ChatHomePage() {
    const [roomKey, setRoomKey] = useState('');
    const [newRoomName, setNewRoomName] = useState('');
    const [error, setError] = useState('');
    const [joinedRooms, setJoinedRooms] = useState<JoinedRoom[]>([]);
    const router = useRouter();
   
      
      
        

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/auth');
            return;
        }

        const fetchData = async () => {
            try {
                const [roomsRes, userRes] = await Promise.all([
                    fetch(`${serverUrl}/api/v1/rooms/my-rooms`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${serverUrl}/api/v1/users/current-user`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (roomsRes.ok) setJoinedRooms((await roomsRes.json()).data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
                setError('Could not load your data.');
            }
        };
        fetchData();
    }, [router]);

    const handleJoinRoom = (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomKey.trim()) return;
        router.push(`/chat/${roomKey.trim()}`);
    };

    
    const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newRoomName.trim()) return;

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      const response = await fetch(`${serverUrl}/api/v1/rooms/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newRoomName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create room.");
      }

      const createdRoomId = data.data.roomId;
      router.push(`/chat/${createdRoomId}`);
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError("An unexpected error occurred");
        }
    }
  };

 

    return (
        <div className="flex h-full bg-discord-gray-900 text-gray-300 font-sans">
           
            <main className="flex-1  bg-gray-950 flex items-center justify-center p-8">
                <div className="max-w-3xl w-full text-center">
                    <Compass size={96} strokeWidth={1.5} className="mx-auto text-discord-gray-800 mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">No Room Selected</h2>
                    <p className="text-gray-400 mb-10 max-w-md mx-auto">
                        Select a room from the sidebar or join an existing one or create a new one to start chatting.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 p-6 rounded-lg text-left shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Plus className="mr-2"/> Create a Room</h3>
                            <form onSubmit={handleCreateRoom}>
                                <input
                                    type="text"
                                    value={newRoomName}
                                    onChange={(e) => setNewRoomName(e.target.value)}
                                    placeholder="e.g. Gaming Crew"
                                    className="w-full bg-discord-gray-900 border borde-gray-1000 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-discord-blurple transition-all"
                                />
                                <button type="submit" className="w-full bg-gray-800 hover:opacity-80 text-white rounded-md py-2 font-semibold transition-opacity">
                                    Create & Join
                                </button>
                            </form>
                        </div>

                        <div className="bg-gray-900 p-6 rounded-lg text-left shadow-lg">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center"><LogIn className="mr-2"/> Join with Key</h3>
                            <form onSubmit={handleJoinRoom}>
                                <input
                                    type="text"
                                    value={roomKey}
                                    onChange={(e) => setRoomKey(e.target.value)}
                                    placeholder="Enter room key"
                                    className="w-full bg-discord-gray-900 border border-discord-gray-1000 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-discord-blurple transition-all"
                                />
                                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-md py-2 font-semibold transition-colors">
                                    Join Room
                                </button>
                            </form>
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-center mt-6">{error}</p>}
                </div>
            </main>
            

            <aside className="w-60 bg-gray-950 flex flex-col">
                <header className="p-4 font-bold text-white shadow-md">
                    Explore Rooms
                </header>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {joinedRooms.map(room => (
                        <Link
                            key={room._id}
                            href={`/chat/${room.roomId}`}
                            className="group relative flex items-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-discord-gray-600 transition-colors"
                        >
                            <div className="absolute left-0 w-1 h-0 bg-white rounded-r-full transition-all duration-200 group-hover:h-5"></div>
                            <Hash className="text-gray-500 group-hover:text-gray-300 ml-1" size={20} />
                            <span className="ml-3 font-semibold">{room.name}</span>
                        </Link>
                    ))}
                </div>

                
            </aside>
        </div>
    );
}