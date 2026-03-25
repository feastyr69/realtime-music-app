import React, { useState, useRef, useEffect } from 'react'
import { IoSend } from "react-icons/io5";
import { io } from 'socket.io-client'

const socket = io("http://localhost:3000");

socket.on("connect", () => {
    console.log("Connected to server");
});

export default function Chat({ roomId, sessionId, userName, className }) {
    const senderId = userName;
    const [chat, setChat] = useState([]);
    const [messageObj, setMessageObj] = useState({ message: "", sender: senderId });
    const messageEndRef = useRef(null);

    useEffect(() => {
        const timestamp = Date.now();
        socket.emit('join-room', roomId, senderId, timestamp);

        socket.on('room-history', (history) => {
            setChat(history);
        });

        socket.on('receive-message', (messageObj) => {
            setChat((chat) => [...chat, messageObj]);
        });

        return () => {
            socket.off('room-history');
            socket.off('receive-message');
        }

    }, [roomId])

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat])

    const handleSend = (e) => {
        e.preventDefault();
        socket.emit('send-message', { roomId, messageObj });
        setChat([...chat, messageObj]);
        setMessageObj({ message: "", sender: senderId });
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSend(e);
        }
    }
    return (
        <>
            <div className={`flex flex-col max-w-80 h-120 p-5 m-10 bg-white/3 rounded-xl border border-white/10 ${className || ''}`}>
                <div className="flex flex-col font-light tracking-tight mb-2 h-full overflow-auto overscroll-contain scrollbar">
                    {
                        chat.map((messageObj, index) => {
                            const msgClass = messageObj.sender === "System" ? "w-full font-medium text-gray-500 uppercase text-sm" : "w-full break-all whitespace-pre-wrap";
                            const isMe = messageObj.sender === senderId;
                            const isSystem = messageObj.sender === "System";
                            const lastSender = chat[index - 1]?.sender;
                            return (
                                <div className={`flex flex-row flex-wrap tracking-tight w-full`} key={index}>
                                    <p className={`${msgClass} font-medium text-purple-300`}>
                                        {
                                            isSystem ? "" : lastSender === messageObj.sender ? "" : isMe ? "You" : messageObj.sender
                                        }
                                    </p>
                                    <p className={`${msgClass} text-sm`}>
                                        {messageObj.message}
                                    </p>
                                </div>
                            )
                        })
                    }
                    <div ref={messageEndRef} />
                </div>
                <div className="flex flex-row">
                    <input type="text" placeholder="Type a message..." className="w-full p-2 my-1 text-sm rounded-xl border border-white/10" value={messageObj.message} onChange={(e) => setMessageObj({ ...messageObj, message: e.target.value })} onKeyDown={handleKeyDown} />
                    <button className="p-3 m-1 ml-2 rounded-full border border-white/10" onClick={handleSend}><IoSend className='size-6' /></button>
                </div>
            </div>
        </>
    )
}