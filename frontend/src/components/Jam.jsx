import React, { useState, useRef, useEffect, useContext } from 'react'
import Navbar from './Navbar'
import Chat from './Chat'
import Player from './Player'
import Queue from './Queue'
import Footer from './Footer';
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid';
import generateUserName from '../utils/nameGenerator';
import { io } from 'socket.io-client'
import { IoChevronForward } from 'react-icons/io5';
import { AnimatePresence, motion } from 'motion/react';
import { apiBaseURL } from '../axiosInstance';
import backendUrl from '../utils/backendUrl';
import { FaCheck } from 'react-icons/fa';
import { IoPersonAdd } from 'react-icons/io5'
import { AuthContext } from '../context/AuthContext';

let sessionId = localStorage.getItem("sessionId");
let userName = localStorage.getItem("userName");

const userInfo = {
    sessionId,
    userName
}

const socket = io(backendUrl, {
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
});


if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("sessionId", sessionId);
}

if (!userName) {
    userName = generateUserName();
    localStorage.setItem("userName", userName);
}

export default function Jam() {
    const { roomId } = useParams();
    const [showPlayer, setShowPlayer] = useState(false);
    const [username, setUserName] = useState(localStorage.getItem("userName") || generateUserName());
    const [roomData, setRoomData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [roomUsers, setRoomUsers] = useState([]);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [activeTab, setActiveTab] = useState(1); // 0=Chat, 1=Player, 2=Queue
    const [connectionStatus, setConnectionStatus] = useState('connected'); // 'connected' | 'disconnected' | 'reconnecting'
    const { user } = useContext(AuthContext);
    const scrollContainerRef = useRef(null);
    const chatRef = useRef(null);
    const playerRef = useRef(null);
    const queueRef = useRef(null);
    // Keep refs to latest roomId & userName so reconnect handler always has fresh values
    const roomIdRef = useRef(roomId);
    const userNameRef = useRef(userName);
    const avatarUrlRef = useRef(null);
    const sessionIdRef = useRef(sessionId);
    const hasJoinedRef = useRef(false); // track if we've ever joined (skip first connect)

    // Keep refs in sync
    useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
    useEffect(() => { userNameRef.current = username; }, [username]);
    useEffect(() => { avatarUrlRef.current = user?.avatar_url ?? null; }, [user]);

    // Auto-reconnect: re-join room whenever the socket reconnects
    useEffect(() => {
        const handleConnect = () => {
            console.log("Socket connected");
            setConnectionStatus('connected');
            // Re-join room on every reconnect (but not the very first connection —
            // Chat.jsx handles the initial join-room on mount)
            if (hasJoinedRef.current) {
                console.log("Reconnected — re-joining room", roomIdRef.current);
                socket.emit('join-room', {
                    roomId: roomIdRef.current,
                    sessionId: sessionIdRef.current,
                    userName: userNameRef.current,
                    avatarUrl: avatarUrlRef.current,
                    joinedAt: Date.now(),
                });
            }
        };

        const handleDisconnect = (reason) => {
            console.warn("Socket disconnected:", reason);
            setConnectionStatus('disconnected');
        };

        const handleReconnectAttempt = (attempt) => {
            console.log(`Reconnect attempt #${attempt}`);
            setConnectionStatus('reconnecting');
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.io.on('reconnect_attempt', handleReconnectAttempt);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.io.off('reconnect_attempt', handleReconnectAttempt);
        };
    }, []);

    useEffect(() => {
        console.log("Checking room...");
        const checkRoom = async () => {
            const res = await apiBaseURL.get(`/room/${roomId}`);
            //console.log(res.data);
            if (res.data.success) {
                setRoomData(res.data);
            }
            await user;
            if (user) {
                console.log(user);
                setUserName(user.google_name || user.username);
                localStorage.setItem("userName", user.google_name || user.username);
            }
            setLoading(false);
        }
        checkRoom();

    }, [roomId])

    useEffect(() => {
        const sectionRefs = [chatRef, playerRef, queueRef];
        const observers = sectionRefs.map((ref, idx) => {
            const obs = new IntersectionObserver(
                ([entry]) => { if (entry.isIntersecting) setActiveTab(idx); },
                { root: scrollContainerRef.current, threshold: 0.55 }
            );
            if (ref.current) obs.observe(ref.current);
            return obs;
        });
        return () => observers.forEach(obs => obs.disconnect());
    }, [showPlayer]);

    useEffect(() => {
        const handleUpdateUsers = (users = []) => {
            //console.log("Users updated:", users);
            setRoomUsers(Array.isArray(users) ? users : []);
        };

        socket.on("update-users", handleUpdateUsers);
        return () => {
            socket.off("update-users", handleUpdateUsers);
        };
    }, []);

    useEffect(() => {
        const worker = new Worker('/keepAliveWorker.js');

        worker.onmessage = () => {
            if (socket.connected) {
                socket.emit('keep-alive', { timestamp: Date.now() });
            }
        };

        worker.postMessage('start');

        return () => {
            worker.postMessage('stop');
            worker.terminate();
        };
    }, []);

    const uniqueUsers = roomUsers.filter((user, index, arr) =>
        index === arr.findIndex((eachUser) => eachUser.userId === user.userId)
    );

    const handleInvite = async () => {
        const inviteUrl = `${window.location.origin}/jam/${roomId}`;
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 1600);
        } catch (error) {
            console.error("Could not copy invite link:", error);
        }
    };

    const handleJoinRoom = () => {
        localStorage.setItem("userName", username);
        userName = username;
        userNameRef.current = username;
        hasJoinedRef.current = true;
        setShowPlayer(true);
    }

    const reconnectBanner = connectionStatus !== 'connected' && (
        <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] text-xs font-semibold uppercase tracking-widest transition-all duration-500 ${connectionStatus === 'reconnecting'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                : 'border-red-500/40 bg-red-500/10 text-red-400'
                }`}
        >
            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'reconnecting' ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                }`} />
            {connectionStatus === 'reconnecting' ? 'Reconnecting…' : 'Disconnected'}
        </div>
    );

    return (
        <>
            <Navbar />
            {reconnectBanner}
            <div className="relative w-full flex justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            className="flex flex-col items-center justify-center w-full h-[70vh]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <motion.div
                                className="rounded-full h-30 w-30 border-2 border-zinc-400 border-t-aura-400 z-100"
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                            />
                        </motion.div>
                    ) : !roomData ? (
                        <motion.div
                            key="missing-room"
                            className="flex flex-col items-center justify-center w-full h-[70vh]"
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                        >
                            <h1 className="text-6xl font-display font-bold text-gray">404 :(</h1>
                            <h1 className="text-2xl font-display font-bold text-gray-200">ROOM EXPIRED</h1>
                        </motion.div>
                    ) : !showPlayer ? (
                        <div className='flex items-center h-[calc(100vh-14rem)]'>
                            <motion.div
                                key="enter-room"
                                className='group relative flex flex-col w-full max-w-85 mt-10 m-4 h-auto p-8 bg-white/4 hover:bg-white/3 rounded-2xl border border-white/12 shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl justify-between text-left transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                                whileHover={{ y: -4 }}
                                whileTap={{ scale: 0.985 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                            >
                                <div className='absolute inset-0 rounded-2xl bg-linear-to-br from-white/8 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none' />

                                <div className='relative flex flex-col gap-5'>
                                    <span className='inline-flex w-fit items-center rounded-full border border-white/20 bg-white/4 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-aura-400/90'>
                                        ROOM ID: {roomId}
                                    </span>
                                    <div className='flex flex-col gap-1'>
                                        <h1 className='text-3xl font-display font-bold uppercase tracking-tight text-white/90 group-hover:text-white transition-colors duration-300'>
                                            Enter Room
                                        </h1>
                                        <h2 className='font-sans font-semibold uppercase tracking-widest text-white/70 group-hover:text-white/80 transition-colors duration-300'>TYPE: {roomData.type}</h2>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <label htmlFor="userName" className='text-sm font-semibold uppercase tracking-[0.08em] text-white/80 group-hover:text-white transition-colors duration-300'>
                                            Your Name
                                        </label>
                                        <input onKeyDown={(e) => { if (e.key === "Enter") handleJoinRoom(); }} type="text" value={username} onChange={(e) => setUserName(e.target.value)} className='w-full px-4 py-2 rounded-lg border border-white/20 bg-white/6 text-white/90 focus:outline-none focus:ring-2 focus:ring-white/40' />
                                    </div>
                                    <p className='max-w-sm text-sm md:text-base text-white/65 leading-relaxed'>
                                        Join the room to chat, queue songs, and keep the music flowing together.
                                    </p>
                                </div>

                                <div className='relative flex items-center justify-between pt-4 mt-4 border-t border-white/10'>
                                    <span className='text-sm font-semibold uppercase tracking-[0.08em] text-white/80 group-hover:text-white transition-colors duration-300'>
                                        Join now
                                    </span>
                                    <motion.button
                                        onClick={handleJoinRoom}
                                        className='inline-flex hover:cursor-pointer h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/6 text-white/90 transition-all duration-300 group-hover:bg-white/12 group-hover:text-white'
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <IoChevronForward size={18} />
                                    </motion.button>
                                </div>
                            </motion.div>
                        </div>
                    ) : (
                        <div className='flex flex-col w-full items-center'>
                            {/* Mobile-only tab navigator */}
                            <div className="xl:hidden flex items-center gap-3 mt-6 mb-2 px-4 py-1 rounded-full border border-white/10 bg-white/4 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                                {["Chat", "Player", "Queue"].map((label, idx) => (
                                    <button
                                        key={label}
                                        type="button"
                                        onClick={() => {
                                            const refs = [chatRef, playerRef, queueRef];
                                            refs[idx].current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-200 ${activeTab === idx
                                            ? "bg-aura-400/15 text-aura-400 border border-aura-400/40"
                                            : "text-zinc-500 hover:text-zinc-300"
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${activeTab === idx ? "bg-aura-400" : "bg-zinc-600"
                                            }`} />
                                        {label}
                                    </button>
                                ))}
                            </div>
                            <motion.div
                                key="room-content"
                                ref={scrollContainerRef}
                                className="flex flex-row w-full items-center justify-start xl:justify-center xl:mt-4 pt-5 p-10 xl:p-10 overflow-x-auto overflow-y-clip snap-x snap-mandatory gap-4 no-scrollbar"
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <motion.div
                                    ref={chatRef}
                                    className="snap-center shrink-0"
                                    initial={{ opacity: 0, x: -28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05, duration: 0.35, ease: "easeInOut" }}
                                >
                                    <Chat roomId={roomId} sessionId={sessionId} userName={userName} avatarUrl={user?.avatar_url} socket={socket} />
                                </motion.div>

                                <motion.div
                                    ref={playerRef}
                                    className='snap-center shrink w-[90%] md:w-full max-w-120 min-w-80'
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.12, duration: 0.35, ease: "easeInOut" }}
                                >
                                    <div className='flex flex-col items-center gap-4'>
                                        <Player roomId={roomId} sessionId={sessionId} userName={userName} socket={socket} />
                                    </div>
                                </motion.div>

                                <motion.div
                                    ref={queueRef}
                                    className="snap-center shrink-0"
                                    initial={{ opacity: 0, x: 28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.18, duration: 0.35, ease: "easeInOut" }}
                                >
                                    <Queue roomId={roomId} sessionId={sessionId} userName={userName} socket={socket} />
                                </motion.div>
                            </motion.div>
                            <motion.div
                                className='flex w-full max-w-3xl items-center gap-3'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.24, duration: 0.35 }}
                            >
                                <div className='w-full min-w-0 mb-15 mx-6 rounded-full border border-white/12 bg-white/4 backdrop-blur-xl shadow-[0_12px_48px_rgba(0,0,0,0.35)] px-4 py-3 flex items-center justify-between gap-2'>
                                    <div className='flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar pr-4 border-r-2 border-white/15'>
                                        {uniqueUsers.length === 0 ? (
                                            <div className='shrink-0 h-9 px-3 rounded-full bg-white/6 border border-white/12 text-zinc-300 text-sm flex items-center'>
                                                Waiting for users
                                            </div>
                                        ) : (
                                            <>
                                                {uniqueUsers.map((participant, index) => (
                                                    <motion.div
                                                        key={participant.userId || `${participant.userName}-${index}`}
                                                        title={participant.userName}
                                                        className='shrink-0 h-9 w-9 rounded-full bg-aura-400/85 text-zinc-950 text-xs font-semibold flex items-center justify-center border border-white/40 overflow-hidden'
                                                        initial={{ opacity: 0, x: -28 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -28 }}
                                                        transition={{ delay: 0.18, duration: 0.35 }}
                                                    >
                                                        {participant.avatarUrl ? (<img className="w-full h-full object-cover rounded-full" src={participant.avatarUrl} alt={participant.userName} />) : (participant.userName || "?").slice(0, 2).toUpperCase()}
                                                    </motion.div>
                                                ))}
                                            </>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleInvite}
                                        className={`h-9 px-4 rounded-full border bg-white/6 hover:bg-white/10 hover:cursor-pointer text-xs uppercase tracking-widest transition-colors ${inviteCopied ? "text-green-500 border-green-500" : "text-aura-400/85 border-aura-400/85"}`}
                                    >
                                        <span className='flex items-center gap-2'>
                                            {inviteCopied ? <FaCheck /> : <IoPersonAdd />}
                                            {inviteCopied ? "Copied" : "Invite"}
                                        </span>
                                    </button>
                                </div>
                            </motion.div>
                            <Footer />
                        </div>
                    )}
                </AnimatePresence>
            </div >
        </>
    )
}