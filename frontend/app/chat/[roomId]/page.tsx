'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import io, { Socket } from 'socket.io-client';
import { serverUrl } from '@/lib/constants'; 

import { Hash, Trash2, UserX, Smile, AtSign, PlusCircle } from 'lucide-react';

interface Message { _id: string; content: string; sender: { _id: string; username: string; avatar?: { url: string }; }; createdAt: string; }
interface Member { _id: string; username: string; avatar?: { url: string }; }
interface RoomDetails { _id: string; name: string; owner: string; members: Member[]; }
interface CurrentUser { _id: string; username: string; }
interface OnlineUser { _id: string; username: string; }

export default function ChatRoomPage() {
    const { roomId } = useParams<{ roomId: string }>();
    const router = useRouter();
    const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [onlineUserIds, setOnlineUserIds] = useState(new Set<string>());
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            router.push('/auth');
            return;
        }

        const initializeRoom = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const joinRes = await fetch(`${serverUrl}/api/v1/rooms/join/${roomId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!joinRes.ok) throw new Error('Room not found or you could not be added.');
                
                const [roomRes, userRes] = await Promise.all([
                    fetch(`${serverUrl}/api/v1/rooms/details/${roomId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${serverUrl}/api/v1/users/current-user`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                if (!roomRes.ok) throw new Error('Failed to fetch room details.');
                if (!userRes.ok) throw new Error('Could not verify your session.');
                
                const roomData = await roomRes.json();
                const userData = await userRes.json();
                
                const uniqueMembers = Array.from(new Map(roomData.data.members.map((m: Member) => [m._id, m])).values());
                setRoomDetails({ ...roomData.data, members: uniqueMembers });
                setCurrentUser(userData.data);
            } catch (err: unknown) {
                if (err instanceof Error) {

                setError(err.message);
                } else {    
                    setError("An unexpected error occurred");
                }
            } finally {
                setIsLoading(false);
            }
        };

        initializeRoom();
    }, [roomId, router]);

    useEffect(() => {
        if (isLoading || !currentUser || !roomDetails) return;

        const token = localStorage.getItem('accessToken');
        const socket = io('http://localhost:8000', { auth: { token } });
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Connected to chat server');
            socket.emit('join room', roomId);
        });

        socket.on('update presence', (onlineUsers: OnlineUser[]) => {
            const newOnlineIds = new Set(onlineUsers.map(user => user._id));
            setOnlineUserIds(newOnlineIds);
        });

        socket.on('member joined', (newMember: Member) => {
            console.log('A new member joined:', newMember);
            setRoomDetails(prevDetails => {
                if (!prevDetails) return null;
                    if (prevDetails.members.find(m => m._id === newMember._id)) {
                    return prevDetails;
                }
                return {
                    ...prevDetails,
                    members: [...prevDetails.members, newMember]
                };
            });
        });

        socket.on('chat history', (history: Message[]) => setMessages(history));
        socket.on('new message', (message: Message) => setMessages(prev => [...prev, message]));

        socket.on('kicked', ({ message }) => {
            alert(message);
            router.push('/chat');
        });

        socket.on('room deleted', ({ message }) => {
            alert(message);
            router.push('/chat');
        });

        socket.on('error', (errorMessage: string) => console.error('Socket Error:', errorMessage));

        return () => {
            socket.disconnect();
        };
    }, [roomId, router, currentUser, roomDetails, isLoading]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && socketRef.current) {
            socketRef.current.emit('room message', { roomId, message: input });
            setInput('');
        }
    };

    const handleDeleteRoom = async () => {
        if (!confirm("Are you sure you want to permanently delete this room?")) return;
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`${serverUrl}/api/v1/rooms/${roomId}/delete`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                socketRef.current?.emit('delete room', { roomId });
            } else { alert("Failed to delete room."); }
        } catch (err) { 
            console.error(err);
            alert("An error occurred while deleting the room."); }
    };

    const handleKickMember = async (memberId: string, memberUsername: string) => {
        if (!confirm(`Are you sure you want to kick ${memberUsername}?`)) return;
        const token = localStorage.getItem('accessToken');
        try {
            const res = await fetch(`${serverUrl}/api/v1/rooms/${roomId}/kick`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ memberId })
            });
            if (res.ok) {
                socketRef.current?.emit('kick user', { roomId, memberId, memberUsername });
            } else { alert("Failed to kick member."); }
        } catch (err) { 
            console.error(err);
            alert("An error occurred while kicking the member."); }
    };

    const groupMessagesByDate = (messages: Message[]) => {
        return messages.reduce((acc, message) => {
            const messageDate = new Date(message.createdAt).toDateString();
            if (!acc[messageDate]) {
                acc[messageDate] = [];
            }
            acc[messageDate].push(message);
            return acc;
        }, {} as Record<string, Message[]>);
    };

    if (isLoading) return <div className="flex items-center justify-center h-screen bg-discord-gray-700 text-white">Loading Room...</div>;
    if (error) return <div className="flex items-center justify-center h-screen bg-discord-gray-700 text-red-400">Error: {error}</div>;
    if (!roomDetails || !currentUser) return <div className="flex items-center justify-center h-screen bg-discord-gray-700 text-white">Could not load data.</div>;

    const isOwner = currentUser._id === roomDetails.owner;
    const groupedMessages = groupMessagesByDate(messages);
    const onlineMembers = roomDetails.members.filter(m => onlineUserIds.has(m._id));
    const offlineMembers = roomDetails.members.filter(m => !onlineUserIds.has(m._id));

    return (
        <div className="flex h-full text-gray-300 font-sans">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col  border-r-white border-r-1">
                <header className="flex-shrink-0 flex items-center p-3 border-b-2  shadow-md z-10">
                    <Hash className="text-discord-gray-500 mx-2" size={24} />
                    <h1 className="text-lg font-bold text-white">{roomDetails.name}</h1>
                    <h1 className="ml-2 text-md align-right text-discord-gray-500">({roomId})</h1>
                </header>

                <main className="flex-1 overflow-y-auto scrollbar-hide pr-2">
                    <div className="p-4">
                        {Object.entries(groupedMessages).map(([date, messagesOnDate]) => (
                            <div key={date}>
                                <div className="relative text-center my-6">
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-discord-gray-700 px-3 text-xs font-semibold text-discord-gray-500">
                                        {new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                {messagesOnDate.map(msg => (
                                    <div key={msg._id} className="group relative flex items-start gap-4 p-2 rounded hover:bg-gray-900/40 transition-colors">
                                        <img src={msg.sender.avatar?.url || 'https://via.placeholder.com/40'} alt={msg.sender.username} className="w-10 h-10 rounded-full mt-1" />
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <p className="font-semibold text-white">{msg.sender.username}</p>
                                                <span className="text-xs text-discord-gray-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-gray-200 break-words">{msg.content}</p>
                                        </div>
                                        <div className="absolute top-0 right-4 -mt-4 p-1 bg-discord-gray-800 border border-discord-gray-1000 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                            <button className="text-gray-400 hover:text-white"><Smile size={18} /></button>
                                            <button className="text-gray-400 hover:text-white"><AtSign size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div ref={messagesEndRef} />
                </main>

                <footer className="px-4 pb-6">
                    <form onSubmit={sendMessage} className="relative bg-gray-900 rounded-lg">
                        <button type="button" className="absolute left-4 top-1/2 -translate-y-1/2 text-discord-gray-500 hover:text-white">
                            <PlusCircle size={24} />
                        </button>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="w-full bg-transparent pl-14 pr-4 py-3 rounded-lg text-white placeholder-discord-gray-500 focus:outline-none"
                            placeholder={`Message #${roomDetails.name}`}
                        />
                    </form>
                </footer>
            </div>

            {/* Member List Sidebar */}
            <aside className="w-60 bg-discord-gray-800  flex flex-col">
                <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-discord-gray-900 scrollbar-track-discord-gray-800">
                    {/* Online Members */}
                    <div className="text-xs font-bold text-discord-gray-500 uppercase">Online — {onlineMembers.length}</div>
                    {onlineMembers.map(member => (
                        <div key={member._id} className="group flex items-center justify-between p-1 rounded">
                            <div className="flex items-center gap-3">
                                <img src={member.avatar?.url || 'https://via.placeholder.com/32'} alt={member.username} className="w-8 h-8 rounded-full" />
                                <span className="text-white font-semibold">{member.username}</span>
                            </div>
                            {isOwner && currentUser._id !== member._id && (
                                <button onClick={() => handleKickMember(member._id, member.username)} className="text-discord-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                    <UserX size={16} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Offline Members */}
                    <div className="text-xs font-bold text-discord-gray-500 uppercase pt-4">Offline — {offlineMembers.length}</div>
                    {offlineMembers.map(member => (
                        <div key={member._id} className="group flex items-center justify-between p-1 rounded opacity-40">
                             <div className="flex items-center gap-3">
                                <img src={member.avatar?.url || 'https://via.placeholder.com/32'} alt={member.username} className="w-8 h-8 rounded-full" />
                                <span className="text-white font-semibold">{member.username}</span>
                            </div>
                            {isOwner && currentUser._id !== member._id && (
                                <button onClick={() => handleKickMember(member._id, member.username)} className="text-discord-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                    <UserX size={16} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                 {isOwner && (
                    <button onClick={handleDeleteRoom} className="w-full text-left p-4 mt-auto border-t-2 border-discord-gray-900 text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                        <Trash2 size={16} /> Delete Room
                    </button>
                )}
            </aside>
        </div>
    );
}