import React, { useState, useRef, useEffect } from 'react'
import { apiBaseURL } from '../axiosInstance';
import { FaSearch } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { AnimatePresence, motion } from 'motion/react';

export default function Queue({ roomId, sessionId, userName, socket }) {
    const [rotation, setRotation] = useState({ x: 0, y: -15 });
    const [searchResults, setSearchResults] = useState([]);
    const [queue, setQueue] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [queuedToast, setQueuedToast] = useState(null);
    const [highlightedSongId, setHighlightedSongId] = useState(null);

    const cardRef = useRef(null);

    let debounceTimer;

    const fetchSearchResults = async (query) => {
        try {
            const response = await apiBaseURL.get(`/search?query=${query}`);
            setSearchResults(response.data);
            setIsSearching(false);
        } catch (error) {
            console.error('Error fetching search results:', error);
            setIsSearching(false);
        }
    };

    const handleSearchInput = (e) => {
        const query = e.target.value;
        clearTimeout(debounceTimer);

        if (query.length > 2) {
            setIsSearching(true);
        } else {
            setIsSearching(false);
            setSearchResults([]);
        }

        debounceTimer = setTimeout(() => {
            if (query.length > 2) {
                fetchSearchResults(query);
            }
        }, 500);
    };

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const rotateY = -((mouseX / width) + 0.4) * 15;
        const rotateX = ((mouseY / height) - 0.5) * 15;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: -15 });
    };

    useEffect(() => {
        socket.emit('get-queue', roomId);

        socket.on('queue-results', (data) => {
            setQueue(data);
        })

        return () => {
            socket.off('queue-results');
        }
    }, [roomId])

    const handleSearchClick = (song) => {
        const videoId = song.videoId;
        socket.emit('log-action', roomId, userName, "cued", Date.now());
        socket.emit('cue-song', roomId, song);
        socket.emit('get-queue', roomId);
        setQueuedToast(song.name);
        setHighlightedSongId(videoId);
        setSearchResults([]);
        setIsFocused(false);
    }

    const handleRemoveSong = (videoId, index) => {
        socket.emit('log-action', roomId, userName, "removed", Date.now());
        socket.emit('remove-song', roomId, index, videoId);
    }

    useEffect(() => {
        if (!queuedToast) return undefined;
        const timer = setTimeout(() => setQueuedToast(null), 1400);
        return () => clearTimeout(timer);
    }, [queuedToast]);

    useEffect(() => {
        if (!highlightedSongId) return undefined;
        const timer = setTimeout(() => setHighlightedSongId(null), 1200);
        return () => clearTimeout(timer);
    }, [highlightedSongId]);

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
                className='flex flex-col w-78 sm:w-80 h-120 p-3 sm:p-5 rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.35)] bg-white/4 backdrop-blur-xl border border-white/10'>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-medium">Add to queue</p>
                <div className='relative w-full h-full'>
                    <AnimatePresence>
                        {queuedToast && (
                            <motion.div
                                key="queued-toast"
                                className="absolute top-0 right-0 z-60 rounded-lg border border-aura-400/40 bg-zinc-950/95 px-3 py-2 text-xs text-aura-300 shadow-lg"
                                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                transition={{ duration: 0.2 }}
                            >
                                Queued: {queuedToast.length > 24 ? `${queuedToast.slice(0, 24)}...` : queuedToast}
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className='flex flex-row w-full items-center relative'>
                        <input
                            type="text"
                            enterKeyHint='search'
                            placeholder='Search for a song'
                            className='w-full p-2 sm:p-2.5 my-1 text-xs sm:text-sm rounded-xl border border-white/10 pr-10 bg-white/3 outline-none focus:border-aura-400/40 text-zinc-200 placeholder:text-zinc-500'
                            onChange={handleSearchInput}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        />
                        <FaSearch className='text-zinc-500 absolute right-3 pointer-events-none' />
                    </div>

                    {isFocused && (isSearching || searchResults.length > 0) && (
                        <div className='absolute top-12 h-80 overflow-y-auto left-0 w-full flex flex-col mt-2 bg-zinc-950/95 border border-white/10 backdrop-blur-xl p-2 px-3 rounded-xl z-50 shadow-xl scrollbar'>
                            {isSearching ? (
                                <div className="flex flex-col gap-2 p-1">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i} className="flex flex-row items-center p-1 animate-pulse">
                                            <div className="w-10 h-10 bg-white/10 rounded-md mr-3"></div>
                                            <div className="flex-1">
                                                <div className="h-3 bg-white/10 rounded w-3/4 mb-2"></div>
                                                <div className="h-2 bg-white/10 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : searchResults.map((song, index) => {
                                return (
                                    <motion.div
                                        key={index}
                                        className='flex flex-row w-full items-center mb-1 p-1 hover:bg-white/10 rounded-lg hover:cursor-pointer transition duration-300'
                                        onMouseDown={() => handleSearchClick(song)}
                                        whileHover={{ x: 2 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <img src={`https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`} alt="" className="w-10 h-10 object-cover rounded-md shrink-0 mr-3" />
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-xs truncate whitespace-nowrap'>{song.name}</p>
                                            <p className='text-[10px] truncate whitespace-nowrap text-white/70'>{song.artist.name}</p>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}

                    <div className='flex flex-col w-full h-full p-2'>
                        <p className='text-[10px] uppercase tracking-[0.2em] mt-3 text-zinc-500 font-medium'>Up next</p>
                        <div className='flex flex-col w-full h-[80%] mt-2 rounded-xl border border-white/8 overflow-y-auto scrollbar snap-y bg-white/2'>
                            {
                                queue.length === 0 ? (
                                    <div className='flex flex-col gap-2 items-center justify-center h-full'>
                                        <p className='text-3xl font-medium'>:(</p>
                                        <div className='flex flex-col items-center'>
                                            <p className='text-sm text-white/70'>Queue Empty</p>
                                            <p className='text-xs text-white/50'>Add Songs to Queue</p>
                                        </div>
                                    </div>
                                ) : queue.map((song, index) => {
                                    return (
                                        <motion.div
                                            key={`${song.videoId}-${index}`}
                                            className={`flex flex-row w-full items-center mb-1 p-1 hover:bg-white/6 rounded-lg cursor-default transition duration-300 ${index === 0 ? 'bg-white/6' : ''} group`}
                                            initial={highlightedSongId === song.videoId ? { opacity: 0.7, y: 10, scale: 0.985 } : false}
                                            animate={highlightedSongId === song.videoId ? { opacity: [0.7, 1], y: [10, 0], scale: [0.985, 1], boxShadow: ["0 0 0 rgba(212,165,116,0)", "0 0 0 1px rgba(212,165,116,0.45)", "0 0 0 rgba(212,165,116,0)"] } : { opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.45, ease: "easeOut" }}
                                        >
                                            <div className="relative w-10 h-10 shrink-0 mr-3">
                                                <img src={`https://i.ytimg.com/vi/${song.videoId}/mqdefault.jpg`} alt="" className="w-10 h-10 object-cover rounded-md" />
                                                {index === 0 && (
                                                    <div className="absolute inset-0 bg-black/40 rounded-md flex items-center justify-center gap-[2px]">
                                                        <motion.div
                                                            animate={{ height: ["4px", "12px", "4px"] }}
                                                            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                                                            className="w-[3px] bg-aura-400 rounded-sm"
                                                        />
                                                        <motion.div
                                                            animate={{ height: ["4px", "16px", "4px"] }}
                                                            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }}
                                                            className="w-[3px] bg-aura-400 rounded-sm"
                                                        />
                                                        <motion.div
                                                            animate={{ height: ["4px", "8px", "4px"] }}
                                                            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }}
                                                            className="w-[3px] bg-aura-400 rounded-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className='flex-1 min-w-0 pr-2'>
                                                <p className={`text-xs sm:text-sm ${index === 0 ? 'text-aura-400 font-medium' : 'text-zinc-200'} truncate whitespace-nowrap`}>{song.name}</p>
                                                <p className='text-[10px] sm:text-xs truncate whitespace-nowrap text-white/70'>{song.artist.name}</p>
                                            </div>
                                            {index !== 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveSong(song.videoId, index);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 ml-1 text-zinc-400 hover:cursor-pointer hover:text-rose-400 focus:outline-none focus:opacity-100"
                                                    aria-label="Remove song"
                                                >
                                                    <IoClose size={20} />
                                                </button>
                                            )}
                                        </motion.div>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}