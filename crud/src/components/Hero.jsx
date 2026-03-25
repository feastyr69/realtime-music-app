import React, { useEffect, useState, useMemo } from "react";
import Form from "./Form";
import { motion } from "framer-motion";
import { IoIosArrowRoundForward } from "react-icons/io";

export default function Hero({ recordData, handleChange, handleSubmit, isUpdating, setIsUpdating, setRecordData }) {

    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => ["Jam", "Listen", "Vibe"],
        []
    );

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
        <div className="w-full m-auto mt-20 flex flex-col md:flex-row gap-12 justify-center items-center px-6 lg:px-46 relative z-10 pt-10">
            <div className="w-full md:max-w-170 text-center flex flex-col justify-center items-center">
                <div className="font-extrabold text-6xl md:text-7xl tracking-tight text-transparent bg-clip-text bg-linear-to-br from-white via-slate-200 to-slate-500 pb-4 pr-4">
                    Feel the Beat Together
                    <span className="relative flex w-full items-center justify-center overflow-hidden md:pb-4 md:pt-1">
                        &nbsp;
                        {titles.map((title, index) => (
                            <motion.span
                                key={index}
                                className="absolute left-0 w-full font-extrabold text-transparent bg-clip-text bg-linear-to-br from-white via-slate-200 to-slate-500"
                                initial={{ opacity: 0, y: -100 }}
                                transition={{ type: "spring", stiffness: 50 }}
                                animate={
                                    titleNumber === index
                                        ? {
                                            y: 0,
                                            opacity: 1,
                                        }
                                        : {
                                            y: titleNumber > index ? -150 : 150,
                                            opacity: 0,
                                        }
                                }
                            >
                                {title}
                            </motion.span>
                        ))}
                    </span>
                </div>
                <div className="font-medium text-xl ml-1 text-slate-400 leading-relaxed max-w-xl">
                    Create room with your friends and listen music in real time together.
                </div>
                <div className="mt-6">
                    <button className="flex flex-row align-center justify-center rounded-full pl-5 pr-4 py-2 border border-white/10 hover:border-white/20 hover:cursor-pointer transition duration-500">Let's Go<span><IoIosArrowRoundForward className="size-6" /></span></button>
                </div>
            </div>
        </div >
    );
}