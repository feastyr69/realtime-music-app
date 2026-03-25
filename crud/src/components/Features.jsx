import React from 'react'
import Card from './Card'

const Features = () => {
    return (
        <>
            <div className="w-full mt-10">
                {/* <h1 className="text-white py-10 font-extrabold text-center text-5xl">HOW IT WORKS?</h1> */}
                <div className="w-[80%] m-auto rounded-3xl">
                    <div className="w-full flex flex-col lg:flex-row justify-center gap-10 mt-10">
                        <Card />
                        <Card />
                        <Card />
                    </div>
                </div>
            </div>
        </>
    )
}

export default Features