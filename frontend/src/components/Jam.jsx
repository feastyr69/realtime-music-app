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
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
});

socket.on("connect", () => {
    console.log("Connected to server");
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
    const [isDisconnected, setIsDisconnected] = useState(false);
    const { user } = useContext(AuthContext);
    const scrollContainerRef = useRef(null);
    const chatRef = useRef(null);
    const playerRef = useRef(null);
    const queueRef = useRef(null);

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

    useEffect(() => {
        const handleDisconnect = () => setIsDisconnected(true);
        const handleReconnect = () => setIsDisconnected(true);

        socket.on('disconnect', handleDisconnect);
        socket.on('connect', handleReconnect);

        return () => {
            socket.off('disconnect', handleDisconnect);
            socket.off('connect', handleReconnect);
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
        setShowPlayer(true);
    }

    return (
        <>
            {/* Connection Lost Overlay */}
            <AnimatePresence>
                {isDisconnected && (
                    <motion.div
                        key="connection-lost"
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', backgroundColor: 'rgba(16, 11, 11, 0.55)' }}
                    >
                        <motion.div
                            className="relative flex flex-col items-center gap-5 p-8 rounded-2xl border border-white/12 shadow-[0_24px_72px_rgba(0,0,0,0.55)] max-w-sm w-[90%] text-center"
                            style={{ background: 'rgba(28, 20, 20, 0.82)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
                            initial={{ opacity: 0, scale: 0.9, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ duration: 0.35, ease: 'easeOut' }}
                        >
                            {/* Pulsing icon */}
                            <motion.div
                                className="flex items-center justify-center w-16 h-16 rounded-full border border-red-500/40 bg-red-500/10"
                                animate={{ scale: [1, 1.08, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            >
                                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="1" y1="1" x2="23" y2="23" />
                                    <path d="M16.72 11.06A11 11 0 0 1 19 12.55M5 12.55a11 11 0 0 1 5.17-2.39M10.71 5.05A11 11 0 0 1 22.56 9M1.42 9a11 11 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
                                </svg>
                            </motion.div>

                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-display font-bold text-white/90 tracking-tight">Connection Lost</h2>
                                <p className="text-sm text-white/50 leading-relaxed">You've been disconnected from the session.<br />Reconnecting automatically&hellip;</p>
                            </div>

                            {/* Reconnecting progress dots */}
                            <div className="flex items-center gap-1.5">
                                {[0, 1, 2].map(i => (
                                    <motion.span
                                        key={i}
                                        className="w-1.5 h-1.5 rounded-full bg-aura-400/70"
                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() => window.location.reload()}
                                className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/8 hover:bg-white/14 border border-white/20 hover:border-white/35 text-sm font-semibold text-white/85 hover:text-white transition-all duration-200 hover:cursor-pointer"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="23 4 23 10 17 10" />
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                                Refresh Page
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <Navbar />
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