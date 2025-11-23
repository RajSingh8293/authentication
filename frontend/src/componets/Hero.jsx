import React from 'react'
import { useSelector } from 'react-redux'

const Hero = () => {
    const { user } = useSelector(state => state.user)
    return (
        <div className="bg-white/10 flex justify-center items-center h-screen">

            <div className='max-w-3xl flex bg-gray-800 p-8 text-white rounded-md shadow-2xl justify-items-stretch gap-5 items-center flex-col'>

                <h1 className='text-3xl font-bold'>Hello everyone!                 {user?.username || ""}   </h1>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. A exercitationem sunt quaerat distinctio, temporibus voluptatum mollitia id cupiditate quam incidunt blanditiis eum, animi repellat corrupti inventore, quibusdam sequi vero obcaecati illum assumenda cum voluptas odio.</p>
            </div>
        </div>
    )
}

export default Hero
