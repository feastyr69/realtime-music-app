import React from 'react'
import { IoMdAdd } from "react-icons/io";
import Navbar from './Navbar'
import { apiBaseURL } from '../axiosInstance';
import { useNavigate } from 'react-router-dom';

const Create = () => {
    const navigate = useNavigate();
    const createRoom = async () => {
        const response = await apiBaseURL.get("/create");
        const roomData = response.data;
        navigate(`/jam/${roomData.roomId}`);
    }
    return (
        <>
            <Navbar />
            <div className="flex items-center justify-center w-full mt-2">
                <div className="w-full max-w-300">
                    <h1 className="text-white pt-10 font-extrabold text-center text-5xl">Create Room</h1>
                    <div className="w-[80%] min-h-[calc(80vh-10rem)] md:h-[calc(80vh-10rem)] flex md:flex-row flex-col items-center mt-10 m-auto rounded-3xl bg-radial-[at_top_center] from-white/5 to-transparent shadow-lg border border-white/10">
                        <div className="flex flex-col justify-center items-center w-[90%] md:w-1/2 h-[90%] py-10 md:py-0 md:p-10 border-b md:border-b-0 md:border-r border-white/10">
                            <h1 className='text-4xl font-bold text-center'>Public Room</h1>
                            <p className='text-center'>Anyone can join this room with the same room ID</p>
                            <button className='p-3 m-6 bg-radial-[at_top_center] from-slate-850 to-slate-900 hover:cursor-pointer hover:scale-110 shadow-lg rounded-full border-2 border-white/10 transition duration-500' onClick={createRoom}><IoMdAdd className='size-15' /></button>
                        </div>
                        <div className="flex flex-col justify-center items-center w-[90%] md:w-1/2 h-[90%] py-10 md:py-0 md:p-10">
                            <h1 className='text-4xl font-bold text-center'>Private Room</h1>
                            <p className='text-center'>(Coming Soon)</p>
                            <button className='p-3 m-6 bg-radial-[at_top_center] from-slate-850 to-slate-900 rounded-full border-2 border-white/10'><IoMdAdd className='size-15' /></button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Create