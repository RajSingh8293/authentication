import React from 'react'
import { NavLink } from 'react-router-dom'

import logo from '../assets/logo_media_2.png'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../redux/slices/useSlice'

const Navbar = () => {
    const dispatch = useDispatch()
    const { user } = useSelector(state => state.user)
    return (
        <div className='bg-gray-800 text-white flex justify-between items-center p-2 lg:px-8 px-4'>
            <div>
                <NavLink to='/'>  <img className='h-12' src={logo} alt="" /></NavLink>
            </div>
            <div>
                {user ?
                    // <NavLink to="/profile" className="p-2 px-3 rounded-full font-bold capitalize bg-black text-white">{user?.username?.slice(0, 1)}</NavLink>
                    <button onClick={() => dispatch(logoutUser())} className="p-2 px-3 cursor-pointer rounded font-bold capitalize bg-black text-white">Logout</button>

                    :

                    <NavLink to="/login" className="py-2 px-3 rounded bg-black text-white">Login</NavLink>

                }
            </div>
        </div>
    )
}

export default Navbar