import React, { useState, useRef, useEffect } from 'react'
import { IoSend } from "react-icons/io5";
import { AnimatePresence, motion } from 'motion/react';


export default function Chat({ roomId, sessionId, userName, avatarUrl, className, socket }) {
    const senderId = userName;
    const [chat, setChat] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [messageObj, setMessageObj] = useState({ message: "", sender: senderId });
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

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [chat])

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageObj.message.trim()) return;
        socket.emit('send-message', { roomId, messageObj });
        setChat((prevChat) => [...prevChat, buildMessage(messageObj)]);
        setMessageObj({ message: "", sender: senderId });
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
                className='flex flex-col w-72 sm:w-80 h-120 p-3 sm:p-4 rounded-xl shadow-[0_12px_48px_rgba(0,0,0,0.35)] bg-white/4 backdrop-blur-xl border border-white/10'
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
                                            <p className={`${msgClass} font-medium text-aura-400/90 text-xs sm:text-sm`}>
                                                {
                                                    isSystem ? "" : lastSender === messageObj.sender ? "" : isMe ? "You" : messageObj.sender
                                                }
                                            </p>
                                            <p className={`${msgClass} text-xs sm:text-sm text-zinc-300`}>
                                                {messageObj.message}
                                            </p>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                        )
                    }
                    <div ref={messageEndRef} />
                </div>
                <div className="flex flex-row">
                    <input type="text" enterKeyHint='send' placeholder="Type a message…" className="w-full p-2 sm:p-2.5 my-1 text-xs sm:text-sm rounded-xl border border-white/10 bg-white/3 text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-aura-400/40" value={messageObj.message} onChange={(e) => setMessageObj({ ...messageObj, message: e.target.value })} onKeyDown={handleKeyDown} />
                    <button type="button" className="p-2 sm:p-3 m-1 ml-2 rounded-full border border-white/12 text-aura-400 hover:bg-aura-400/10 transition-colors" onClick={handleSend} aria-label="Send message"><IoSend className='size-5 sm:size-6' /></button>
                </div>
            </div>
        </>
    )
}