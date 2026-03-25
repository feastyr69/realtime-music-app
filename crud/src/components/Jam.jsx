import React, { useEffect, useState, useRef } from 'react'
import Navbar from './Navbar'
import Chat from './Chat'
import { useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid';
import generateUserName from '../utils/nameGenerator';

let sessionId = localStorage.getItem("sessionId");
let userName = localStorage.getItem("userName");

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
    const [rotation, setRotation] = useState({ x: 0, y: 15 });
    const cardRef = useRef(null);

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

    return (
        <>
            <Navbar />
            <div className="flex flex-row">
                <div
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    style={{
                        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                        transition: rotation.x === 0 && rotation.y === 15 ? 'transform 0.5s ease-out' : 'transform 0.1s ease-out',
                        transformStyle: 'preserve-3d'
                    }}

                >
                    <Chat roomId={roomId} sessionId={sessionId} userName={userName} className="w-full shadow-2xl bg-white/5 backdrop-blur-md border border-white/20" />
                </div>
            </div>
        </>
    )
}