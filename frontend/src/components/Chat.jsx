import React, { useState, useRef, useEffect, useCallback } from 'react'
import { IoSend } from "react-icons/io5";
import { AnimatePresence, motion } from 'motion/react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

const gf = new GiphyFetch(import.meta.env.VITE_GIPHY_API_KEY);

function GiphyPicker({ onSelect, onClose }) {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const searchRef = useRef(null);

    useEffect(() => { searchRef.current?.focus(); }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(t);
    }, [query]);

    const fetchGifs = useCallback(
        (offset) => debouncedQuery
            ? gf.search(debouncedQuery, { offset, limit: 12 })
            : gf.trending({ offset, limit: 12 }),
        [debouncedQuery]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-full mb-2 left-0 right-0 z-50 rounded-xl border border-white/10 bg-black/85 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
            style={{ height: '280px' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 shrink-0">
                <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">GIF</span>
                <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search GIPHY…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none"
                />
                <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors leading-none" aria-label="Close GIF picker">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                <Grid
                    key={debouncedQuery}
                    width={280}
                    columns={3}
                    gutter={4}
                    fetchGifs={fetchGifs}
                    onGifClick={(gif, e) => { e.preventDefault(); onSelect(gif); }}
                    noLink
                    hideAttribution
                    style={{ padding: '6px' }}
                />
            </div>
        </motion.div>
    );
}


export default function Chat({ roomId, sessionId, userName, avatarUrl, className, socket }) {
    const senderId = userName;
    const [chat, setChat] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [messageObj, setMessageObj] = useState({ message: "", sender: senderId });
    const [showGiphy, setShowGiphy] = useState(false);
    const pickerRef = useRef(null);
    const messageEndRef = useRef(null);
    const chatScrollRef = useRef(null);
    const [rotation, setRotation] = useState({ x: 0, y: 15 });

    const cardRef = useRef(null);
    const buildMessage = (msg) => ({
        ...msg,
        localId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const rotateY = -((mouseX / width) - 1.4) * 20;
        const rotateX = ((mouseY / height) - 0.5) * 20;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 15 });
    };


    useEffect(() => {
        const timestamp = Date.now();
        const clientData = { roomId, sessionId, userName, avatarUrl, joinedAt: timestamp };
        console.log(clientData);
        socket.emit('join-room', clientData);
        socket.on('room-history', (history) => {
            setIsLoading(false);
            setChat(history.map((msg) => buildMessage(msg)));
        });

        socket.on('receive-message', (messageObj) => {
            setChat((prevChat) => [...prevChat, buildMessage(messageObj)]);
        });

        return () => {
            socket.off('room-history');
            socket.off('receive-message');
        }

    }, [roomId])

    const scrollToBottom = useCallback(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chat, scrollToBottom])

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageObj.message.trim()) return;
        socket.emit('send-message', { roomId, messageObj });
        setChat((prevChat) => [...prevChat, buildMessage(messageObj)]);
        setMessageObj({ message: "", sender: senderId });
    }

    const handleGifSelect = (gif) => {
        const gifUrl = gif.images.fixed_height_small.url || gif.images.downsized.url;
        const gifMsg = { message: '', gifUrl, sender: senderId };
        socket.emit('send-message', { roomId, messageObj: gifMsg });
        setChat((prevChat) => [...prevChat, buildMessage(gifMsg)]);
        setShowGiphy(false);
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend(e);
        }
    }
    return (
        <>
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transition: 'transform 0.5s ease-out',
                    transformStyle: 'preserve-3d'
                }}
                className='flex flex-col w-78 sm:w-80 h-120 p-3 sm:p-4 rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.35)] bg-white/4 backdrop-blur-xl border border-white/10'
            >
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-medium">Room chat</p>
                <div ref={chatScrollRef} className="flex flex-col font-light tracking-tight mb-2 h-full overflow-y-auto overflow-x-hidden snap-y scrollbar">
                    {
                        isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-2 border-zinc-600 border-t-aura-400"></div>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {chat.map((messageObj, index) => {
                                    const msgClass = messageObj.sender === "System" ? "w-full font-medium text-zinc-500 uppercase text-sm" : "w-full break-words whitespace-pre-wrap";
                                    const isMe = messageObj.sender === senderId;
                                    const isSystem = messageObj.sender === "System";
                                    const lastSender = chat[index - 1]?.sender;
                                    const isIncoming = !isSystem && !isMe;
                                    return (
                                        <motion.div
                                            className={`flex flex-row flex-wrap tracking-tight w-full rounded-md px-1 ${isIncoming ? "hover:bg-white/3" : ""}`}
                                            key={messageObj.localId || `${messageObj.sender}-${index}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={isIncoming ? { opacity: 1, y: 0, backgroundColor: ["rgba(212,165,116,0.16)", "rgba(212,165,116,0.06)", "rgba(0,0,0,0)"] } : { opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.35, ease: "easeOut" }}
                                        >
                                            <p className={`${msgClass} font-medium text-aura-400/90 text-sm`}>
                                                {
                                                    isSystem ? "" : lastSender === messageObj.sender ? "" : isMe ? "You" : messageObj.sender
                                                }
                                            </p>
                                            <p className={`${msgClass} text-sm text-zinc-300`}>
                                                {messageObj.gifUrl
                                                    ? <img src={messageObj.gifUrl} alt="GIF" className="rounded-lg max-w-[180px] mt-1" loading="lazy" onLoad={scrollToBottom} />
                                                    : messageObj.message
                                                }
                                            </p>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )
                    }
                    <div ref={messageEndRef} />
                </div>
                <div className="relative flex flex-row" ref={pickerRef}>
                    <AnimatePresence>
                        {showGiphy && <GiphyPicker onSelect={handleGifSelect} onClose={() => setShowGiphy(false)} />}
                    </AnimatePresence>
                    <input type="text" enterKeyHint='send' placeholder="Type a message…" className="w-full px-2 sm:px-2.5 my-1 text-xs sm:text-sm rounded-xl border border-white/10 bg-white/3 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-aura-400/40" value={messageObj.message} onChange={(e) => setMessageObj({ ...messageObj, message: e.target.value })} onKeyDown={handleKeyDown} />
                    <button type="button" onClick={() => setShowGiphy((v) => !v)} aria-label="Open GIF picker" className={`absolute left-1/2 translate-x-9 translate-y-1 rounded-xl p-2 ml-1 my-1 text-xs font-bold tracking-wider transition-colors shrink-0 ${showGiphy ? 'border-aura-400/60 text-aura-400 bg-aura-400/10' : 'border-white/12 text-zinc-400 hover:text-aura-400 hover:border-aura-400/40'}`}>GIF</button>
                    <button type="button" className="py-2 px-2 sm:px-3 m-1 ml-1 rounded-full border border-white/12 text-aura-400 hover:bg-aura-400/10 transition-colors" onClick={handleSend} aria-label="Send message"><IoSend className='size-5 sm:size-6' /></button>
                </div>
            </div>
        </>
    )
}