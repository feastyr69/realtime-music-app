import React, { useState, useRef, useEffect } from 'react';
import YouTube from 'react-youtube';
import { IoPlay, IoPause, IoPlaySkipBack, IoPlaySkipForward, IoVolumeHigh } from 'react-icons/io5';
import { PiVinylRecordLight } from 'react-icons/pi';

export default function Player({ roomId, userName, socket }) {


    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const cardRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(100);
    const [showVolume, setShowVolume] = useState(false);
    const volumeRef = useRef(null);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isPlayPauseDisabled, setIsPlayPauseDisabled] = useState(false);

    const isPlayingRef = useRef(isPlaying);
    const currentSongRef = useRef(currentSong);
    const isPlayerReadyRef = useRef(isPlayerReady);
    const loadedVideoIdRef = useRef(null);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
        currentSongRef.current = currentSong;
        isPlayerReadyRef.current = isPlayerReady;
    }, [isPlaying, currentSong, isPlayerReady]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (volumeRef.current && !volumeRef.current.contains(e.target)) {
                setShowVolume(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const rotateY = -((mouseX / width) - 0.5) * 5;
        const rotateX = ((mouseY / height) - 0.5) * 5;

        setRotation({ x: rotateX, y: rotateY });
    };

    const handleMouseLeave = () => {
        setRotation({ x: 0, y: 0 });
    };

    const playerRef = useRef(null);
    const progressInterval = useRef(null);
    const onReady = (event) => {
        playerRef.current = event.target;
        console.log('just joined, requesting sync')
        playerRef.current.setPlaybackQuality('small');
        isPlayingRef.current = true;
        setIsPlayerReady(true);
    }

    const handlePlay = () => {
        if (playerRef.current?.playVideo) playerRef.current.playVideo();
        setIsPlaying(true);
    }

    const handlePause = () => {
        if (playerRef.current?.pauseVideo) playerRef.current.pauseVideo();
        setIsPlaying(false);
    }

    const handleSeek = (sec) => {
        const newProgress = parseFloat(sec.target.value);
        if (playerRef.current?.seekTo) playerRef.current.seekTo(newProgress);
        setProgress(newProgress);
        socket.emit('sync-song', roomId, {
            videoId: currentSongRef.current?.videoId,
            isPlaying: isPlayingRef.current,
            progress: newProgress,
            duration: currentSongRef.current?.duration,
            timestamp: Date.now()
        });
    }

    const handlePlayPause = () => {
        if (isPlayPauseDisabled) return;
        setIsPlayPauseDisabled(true);
        setTimeout(() => setIsPlayPauseDisabled(false), 600); // 600ms rate limit

        const newState = !isPlaying;
        if (newState) {
            handlePlay();
        } else {
            handlePause();
        }

        const currentSec = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        socket.emit('sync-song', roomId, {
            videoId: currentSong?.videoId,
            isPlaying: newState,
            progress: currentSec,
            duration: currentSong?.duration,
            timestamp: Date.now()
        });
    }

    const handleNext = () => {
        if (currentSongRef.current?.duration) {
            socket.emit('log-action', roomId, userName, "skipped", Date.now());
            const sec = { target: { value: currentSongRef.current?.duration } };
            handleSeek(sec);
        }
    }
    const handlePrev = () => {
        if (currentSongRef.current) {
            const sec = { target: { value: 0 } };
            handleSeek(sec);
        }
    }

    const handleVolumeChange = (vol) => {
        const newVolume = parseFloat(vol.target.value);
        if (playerRef.current?.setVolume) playerRef.current.setVolume(newVolume);
        setVolume(newVolume);
    }

    const handleStateChange = (event) => {
        if (event.data === 3) setIsBuffering(true);
        else setIsBuffering(false);

        // Sync React state if the browser blocks Autoplay or the user pauses manually
        if (event.data === 1) setIsPlaying(true);
        if (event.data === 2) setIsPlaying(false);
    }

    useEffect(() => {
        if (!isPlayerReady) return;
        console.log('player ready');

        socket.emit('request-sync', roomId);
        socket.emit('get-current-song', roomId);

        socket.on('provide-sync', () => {
            if (currentSongRef.current && isPlayerReadyRef.current) {
                const currentSec = playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
                socket.emit('sync-song', roomId, {
                    videoId: currentSongRef.current.videoId,
                    isPlaying: isPlayingRef.current,
                    progress: currentSec,
                    duration: currentSongRef.current.duration,
                    songData: currentSongRef.current,
                    timestamp: Date.now()
                });
            }
        });

        socket.on('current-song', (data) => {
            console.log('song came', data);
            if (!data) {
                setCurrentSong(null);
                if (isPlayerReadyRef.current) playerRef.current?.cueVideoById?.({ videoId: "" });
                loadedVideoIdRef.current = null;
                return;
            }
            if (currentSongRef.current?.videoId !== data.videoId) {
                setCurrentSong(data);
            }
        })

        socket.on('receive-sync-song', (data) => {
            console.log("receive-sync-song", data);
            const { videoId, isPlaying: syncIsPlaying, songData, timestamp } = data;

            // latency compensation
            const latencyOffset = (timestamp && syncIsPlaying) ? (Date.now() - timestamp) / 1000 : 0;
            const syncProgress = (data.progress || 0) + latencyOffset;

            // Needs loading?
            if (videoId !== loadedVideoIdRef.current) {
                if (isPlayerReadyRef.current) {
                    playerRef.current?.loadVideoById?.({ videoId, startSeconds: syncProgress });
                    loadedVideoIdRef.current = videoId;
                }
                if (songData) setCurrentSong(songData);
                setProgress(syncProgress);
                setIsPlaying(syncIsPlaying);
                return;
            }

            // same song 
            const currentSec = playerRef.current?.getCurrentTime?.() ?? 0;
            if (syncProgress !== undefined && Math.abs(currentSec - syncProgress) > 1) {
                playerRef.current?.seekTo?.(syncProgress);
                setProgress(syncProgress);
            }
            if (syncIsPlaying !== undefined && syncIsPlaying !== isPlayingRef.current) {
                syncIsPlaying ? playerRef.current?.playVideo?.() : playerRef.current?.pauseVideo?.();
                setIsPlaying(syncIsPlaying);
            }
        })

        return () => {
            socket.off('current-song');
            socket.off('receive-sync-song');
            socket.off('provide-sync');
        }
    }, [roomId, isPlayerReady])

    useEffect(() => {
        if (!isPlayerReady || !currentSong) return;
        if (isPlayingRef.current) {
            progressInterval.current = setInterval(() => {
                setProgress(playerRef.current.getCurrentTime());
                const state = playerRef.current.getPlayerState();
                if (state === 0 || state === -1) {
                    clearInterval(progressInterval.current);
                    setIsPlaying(false);
                    socket.emit('next-song', roomId, currentSong.videoId);
                }
            }, 1000);
        } else {
            clearInterval(progressInterval.current);
        }

        return () => {
            clearInterval(progressInterval.current);
        }
    }, [isPlaying, isPlayerReady, currentSong])


    return (
        <>
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                tabIndex={0}
                style={{
                    transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transition: rotation.x === 0 && rotation.y === 0 ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
                    transformStyle: 'preserve-3d'
                }}
                className='flex flex-col w-full h-120 p-6 bg-white/[0.04] rounded-xl border border-white/[0.1] shadow-[0_12px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl justify-between'
            >
                {/* Hidden YouTube Player */}
                <div className="absolute opacity-0 pointer-events-none">
                    <YouTube videoId="" opts={{
                        height: '10',
                        width: '10',
                        playerVars: {
                            autoplay: 1,
                            playsinline: 1,
                            controls: 0,
                            disablekb: 1,
                        }
                    }}
                        onReady={onReady}
                        onStateChange={handleStateChange}
                    />
                </div>

                {/* Header */}
                <div className="flex justify-center items-center w-full mb-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">Now playing</p>
                </div>

                {/* Album Art Container */}
                <div className="w-full flex-1 relative rounded-xl overflow-hidden shadow-2xl mb-6 group border border-white/[0.08] max-h-64 mx-auto max-w-47 bg-zinc-900/60">
                    {isBuffering && <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="animate-spin rounded-full h-12 w-12 border-2 border-zinc-400 border-t-aura-400 z-100"></div>
                    </div>}
                    {currentSong && <img
                        src={`https://i.ytimg.com/vi/${currentSong.videoId}/maxresdefault.jpg`}
                        alt="Album Art"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                    />}
                    <div className="absolute flex items-center justify-center inset-0 bg-linear-to-t from-black/15 to-transparent pointer-events-none">
                        {!currentSong && <PiVinylRecordLight className="text-aura-400/40" size={120} />}
                    </div>
                </div>

                {/* Song Info */}
                <div className="flex flex-col items-center mb-4 text-center w-full px-2">
                    {currentSong ? (
                        <>
                            <h2 className="font-display text-base sm:text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight truncate w-full">{currentSong.name}</h2>
                            <p className="text-aura-400/90 font-medium text-xs sm:text-sm mt-1 truncate w-full">{currentSong.artist.name}</p>
                        </>
                    ) : (
                        <>
                            <h2 className="font-display text-base sm:text-xl md:text-2xl font-semibold text-zinc-300 tracking-tight truncate w-full">No song playing</h2>
                            <p className="text-zinc-500 font-medium text-xs sm:text-sm mt-1 truncate w-full">Add a track from the queue</p>
                        </>
                    )}
                </div>

                {/* Playback Controls Area */}
                <div className="flex flex-col w-full mt-auto">
                    {/* Scrubber */}
                    <div className="w-full mb-4 px-2">
                        <div className="w-full h-[6px] bg-white/10 rounded-full relative overflow-hidden group">
                            <input
                                type="range"
                                min="0"
                                max={currentSong ? currentSong.duration : 0}
                                value={progress}
                                onChange={handleSeek}
                                className="absolute h-full w-full cursor-pointer accent-aura-400"
                            />
                        </div>
                        <div className="flex justify-between w-full mt-2 text-[10px] text-zinc-500 font-medium tracking-wider">
                            {currentSong ? <span>
                                {Math.floor(progress / 60)}:
                                {Math.floor(progress % 60).toString().padStart(2, '0')}
                            </span> : <span>- : -</span>}
                            {currentSong ? <span>
                                {Math.floor(currentSong.duration / 60)}:
                                {Math.floor(currentSong.duration % 60).toString().padStart(2, '0')}
                            </span> : <span>- : -</span>}
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="relative flex w-full items-center justify-between px-2 pt-1">
                        <div className="flex w-8 relative" ref={volumeRef}>
                            <button
                                type="button"
                                onClick={() => setShowVolume(!showVolume)}
                                className="text-zinc-500 hover:text-zinc-200 transition"
                                aria-label="Volume"
                            >
                                <IoVolumeHigh size={24} />
                            </button>
                            {showVolume && (
                                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center bg-zinc-900/50 backdrop-blur-md border border-white/10 rounded-xl shadow-xl"
                                    style={{ width: 36, height: 120 }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="cursor-pointer accent-aura-400"
                                        style={{ width: 90, transform: 'rotate(-90deg)' }}
                                    />
                                </div>
                            )}
                        </div>


                        <div className="flex items-center gap-6">
                            <button type="button"
                                onClick={handlePrev}
                                className="text-zinc-200 hover:text-aura-400 transition hover:scale-110 drop-shadow-lg" aria-label="Previous">
                                <IoPlaySkipBack size={32} />
                            </button>

                            <button
                                type="button"
                                disabled={isPlayPauseDisabled}
                                className={`w-16 h-16 flex items-center justify-center bg-aura-400 text-zinc-950 rounded-full transition shadow-[0_0_28px_rgba(212,165,116,0.25)] ${isPlayPauseDisabled ? 'opacity-60 cursor-not-allowed scale-95' : 'hover:scale-105 hover:bg-aura-300'}`}
                                onClick={handlePlayPause}
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? <IoPause size={30} /> : <IoPlay size={32} className="ml-1" />}
                            </button>

                            <button type="button"
                                onClick={handleNext}
                                className="text-zinc-200 hover:text-aura-400 transition hover:scale-110 drop-shadow-lg" aria-label="Next">
                                <IoPlaySkipForward size={32} />
                            </button>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    socket.emit('request-sync', roomId);
                                }} className="text-[10px] font-semibold tracking-widest text-zinc-500 hover:text-aura-400 transition uppercase">Sync</button>
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}