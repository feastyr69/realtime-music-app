import React, { useEffect, useState, useMemo, useContext } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { IoIosArrowRoundForward } from "react-icons/io";
import { AuthContext } from "../context/AuthContext";

export default function Hero() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(() => ["Listen", "Sync", "Share"], []);
    const headings = ["Not your average\n Spotify Clone.", "One room,\n Every beat in sync.", "Music is better\n together."];
    const [randomIndex] = useState(() => Math.floor(Math.random() * headings.length));
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-8 md:mt-12 relative z-10">
            <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-zinc-950/50 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_80px_-24px_rgba(0,0,0,0.8),0_0_100px_-30px_rgba(212,165,116,0.18)]">
                {/* Animated aurora blobs */}
                <div
                    className="pointer-events-none absolute inset-0 overflow-hidden rounded-4xl"
                    aria-hidden
                >
                    <motion.div
                        className="absolute -top-[20%] left-[5%] h-[min(420px,55vw)] w-[min(420px,55vw)] rounded-full bg-aura-400/25 blur-[100px]"
                        animate={{
                            x: [0, 40, -25, 0],
                            y: [0, 35, -15, 0],
                            scale: [1, 1.08, 0.96, 1],
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute top-[30%] -right-[10%] h-[min(380px,50vw)] w-[min(380px,50vw)] rounded-full bg-violet-500/20 blur-[90px]"
                        animate={{
                            x: [0, -35, 25, 0],
                            y: [0, -30, 40, 0],
                            scale: [1, 1.12, 0.94, 1],
                        }}
                        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    />
                    <motion.div
                        className="absolute -bottom-[15%] left-[25%] h-[min(340px,45vw)] w-[min(340px,45vw)] rounded-full bg-cyan-500/12 blur-[85px]"
                        animate={{
                            x: [0, -30, 35, 0],
                            y: [0, 25, -20, 0],
                            scale: [1, 0.92, 1.06, 1],
                        }}
                        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    />
                    <motion.div
                        className="absolute top-[10%] left-[40%] h-[min(280px,40vw)] w-[min(280px,40vw)] rounded-full bg-amber-200/10 blur-[70px]"
                        animate={{
                            opacity: [0.4, 0.75, 0.45, 0.4],
                            scale: [1, 1.15, 1, 1],
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Grid + moving shine */}
                    <div className="absolute inset-0 hero-panel-grid opacity-90" />
                    <div className="absolute inset-0 hero-panel-shine opacity-60 mix-blend-overlay" />

                    {/* Bottom edge fade into page */}
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-zinc-950/90 to-transparent rounded-b-4xl" />
                </div>

                <div className="relative z-10 flex flex-col gap-10 justify-center items-center px-6 sm:px-10 lg:px-14 pt-14 pb-16 md:pt-18 md:pb-22 text-center">
                    <div className="w-full flex flex-col justify-center items-center">
                        <p className="font-display text-xs md:text-sm uppercase tracking-[0.35em] text-aura-400/95 mb-4">
                            Aura
                        </p>
                        <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl whitespace-pre tracking-tight text-transparent bg-clip-text bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-400 pb-2 drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
                            {headings[randomIndex]}
                        </h1>
                        <div className="relative flex w-full min-h-14 sm:min-h-16 items-center justify-center overflow-hidden mt-4 md:mt-6">
                            {titles.map((title, index) => (
                                <motion.span
                                    key={index}
                                    className="absolute left-0 w-full font-display font-bold text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-linear-to-br from-aura-200 via-aura-400 to-amber-700/90"
                                    initial={{ opacity: 0, y: -80 }}
                                    transition={{ type: "spring", stiffness: 55 }}
                                    animate={
                                        titleNumber === index
                                            ? { y: 0, opacity: 1 }
                                            : {
                                                y: titleNumber > index ? -120 : 120,
                                                opacity: 0,
                                            }
                                    }
                                >
                                    {title}
                                </motion.span>
                            ))}
                        </div>
                        <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl mt-8">
                            Create a space, queue tracks, and listen with friends in real time, playback and chat stay locked to the room.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
                            <Link
                                to="/create"
                                className="inline-flex flex-row items-center justify-center gap-1 rounded-full pl-6 pr-4 py-3 bg-aura-400 text-zinc-950 font-semibold text-sm shadow-[0_0_40px_rgba(212,165,116,0.35)] hover:bg-aura-300 transition-colors w-full sm:w-auto"
                            >
                                Start a room
                                <IoIosArrowRoundForward className="size-7 shrink-0" aria-hidden />
                            </Link>
                            {user ? (
                                <></>
                            ) : (
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center rounded-full px-6 py-3 border border-white/15 text-zinc-100 font-medium text-sm bg-white/4 hover:border-aura-400/45 hover:bg-white/7 transition-colors w-full sm:w-auto backdrop-blur-sm"
                                >
                                    Create an account
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
