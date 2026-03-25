import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <div className="w-full flex justify-center items-center h-28 pt-4 relative z-20">
            <div className="w-full max-w-[90vw] md:max-w-[70vw] flex justify-between h-16 items-center bg-white/5 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] px-8 border border-white/10 rounded-full">
                <Link to="/" className="flex items-center h-full justify-center">
                    <h1 className="font-extrabold text-2xl tracking-tight text-transparent bg-clip-text bg-linear-to-r from-slate-200 via-white to-slate-200">
                        LOGO
                    </h1>
                </Link>
                <div className="h-full flex items-center justify-center">
                    <ul className="flex list-none gap-8 items-center font-medium text-slate-300 text-sm">
                        <li className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">Home</li>
                        <li className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">Features</li>
                        <li className="cursor-pointer hover:text-cyan-400 transition-colors duration-300">About</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}