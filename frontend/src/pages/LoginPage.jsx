import React, { useEffect, useState } from 'react'
import { CiLock, CiMail, CiUser } from "react-icons/ci";
import { IoEye, IoEyeOff } from "react-icons/io5";
import { FiArrowLeft } from "react-icons/fi";
import { axiosInstance } from '../lib/axios';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '../redux/slices/useSlice';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
const LoginPage = () => {
    const [authType, setAuthType] = useState("login")
    const [userData, setUserData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        newPassword: "",
        otp: "",
    })
    const [errors, setErrors] = useState({})
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)
    const { user } = useSelector(state => state.user)

    const dispatch = useDispatch()
    const navigate = useNavigate()


    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")



    const onChangeHandler = (e) => {
        const { name, value } = e.target
        setUserData({ ...userData, [name]: value })
    }
    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (authType === "login") {
            if (!userData.email) newErrors.email = "Email is required.";
            else if (!emailRegex.test(userData.email)) newErrors.email = "Invalid email.";
            if (!userData.password) newErrors.password = "Password is required.";
        } else if (authType === "register") {
            if (!userData.username) newErrors.username = "Username is required.";
            if (!userData.email) newErrors.email = "Email is required.";
            else if (!emailRegex.test(userData.email)) newErrors.email = "Invalid email.";
            if (!userData.password) newErrors.password = "Password is required.";
            else if (userData.password.length < 6) newErrors.password = "Password must be at least 6 characters.";
        }
        else if (authType === "verify-email") {
            if (!userData.otp) newErrors.otp = "OTP is required.";
        }
        else if (authType === "forgotPassword") {
            if (!userData.email) newErrors.email = "Email is required.";
            else if (!emailRegex.test(userData.email)) newErrors.email = "Invalid email.";
        } else if (authType === "passwordChange") {
            if (!userData.newPassword) newErrors.newPassword = "New password is required.";
            else if (userData.newPassword.length < 6) newErrors.newPassword = "Password must be at least 6 characters.";
            if (!userData.confirmPassword) newErrors.confirmPassword = "Confirm password is required.";
            else if (userData.newPassword !== userData.confirmPassword) newErrors.confirmPassword = "Passwords do not match.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const switchView = (newView) => {
        setAuthType(newView)
        setErrors({})

        setUserData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            newPassword: "",
            otp: "",
        })

    }


    useEffect(() => {
        if (user) {
            navigate("/")
        }
    }, [user, navigate])

    useEffect(() => {
        if (token) {
            setAuthType("reset-pass")
        }
    }, [token])

    const submitHandler = async (e) => {
        e.preventDefault()
        setErrors({})
        if (!validateForm()) return

        setLoading(true)

        if (authType === "login") {
            try {
                const { data } = await axiosInstance.post('/api/users/login', userData)
                console.log("data :", data);

                if (data?.success) {
                    dispatch(setUser(data?.user))
                    navigate("/")
                }

                if (data?.needsVerification) {
                    toast.success(data?.message || "OTP sent to your email")
                    switchView("verify-email")
                    return
                }
            } catch (error) {

                // switchView("verify-email")

                const resp = error?.response?.data;
                if (resp?.needsVerification) {
                    toast.success(resp?.message || "OTP sent to your email")
                    switchView("verify-email")
                    return

                }
                toast.error(resp?.message || "Action failed")
            } finally {
                setLoading(false)
            }
        } else if (authType === "register") {
            try {
                const { data } = await axiosInstance.post('/api/users/register', userData)

                if (data?.success && data?.needsVerification) {
                    toast.success(data?.message || "OTP sent to your email")
                    switchView("verify-email")
                    return
                }
            } catch (error) {
                toast.error(error?.response?.data?.message || "Register failed");

            } finally {
                setLoading(false)
            }
        }
        else if (authType === "verify-email") {
            try {
                const { data } = await axiosInstance.post('/api/users/email-verify', userData)
                if (data?.success) {
                    dispatch(setUser(data?.user))
                    navigate("/")
                }
            } catch (error) {
                toast.error(error?.response?.data?.message || "email verify failed")

            } finally {
                setLoading(false)
            }
        }
        else if (authType === "forgot-pass") {
            try {
                const { data } = await axiosInstance.post('/api/users/forgot-password', userData)
                if (data?.success) {
                    switchView("login")
                }
            } catch (error) {
                toast.error(error?.response?.data?.message || "forgot password failed")

            } finally {
                setLoading(false)
            }
        } else if (authType === "reset-pass") {
            try {
                const { data } = await axiosInstance.post(`/api/users/reset-password/${token}`, {
                    password: userData.newPassword,
                    confirmPassword: userData.confirmPassword,
                })
                if (data?.success) {
                    switchView("login")
                    toast.success(data.message || "Password reset successfully")
                }
            } catch (error) {
                toast.error(error?.response?.data?.message || "Reset password failed")

            } finally {
                setLoading(false)
            }
        }
        setUserData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            newPassword: "",
            otp: "",
        })
        setLoading(false)

    }

    const renderRegisterForm = () => (
        <>
            <h2 className='text-3xl font-bold mb-6 text-center  text-white'>Create Account</h2>
            <p className='text-gray-300  mb-6 text-center'>Join our platform today</p>

            {/* Username  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiUser size={24} />
                    </span>
                    <input
                        type="text"
                        name='username'
                        value={userData.username}
                        onChange={onChangeHandler}
                        placeholder='Username'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.username ? "border-red-500" : "bg-gray-700"}`}
                    />

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.username}</p>
            </div>
            {/* Email  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiMail size={24} />
                    </span>
                    <input
                        type="email"
                        name='email'
                        value={userData.email}
                        onChange={onChangeHandler}
                        placeholder='Email'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.email ? "border-red-500" : "bg-gray-700"}`}
                    />

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.email}</p>
            </div>
            {/* Password  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiLock size={24} />
                    </span>
                    <input
                        type={showPass ? 'text' : 'password'}
                        name='password'
                        value={userData.password}
                        onChange={onChangeHandler}
                        placeholder='Password'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.password ? "border-red-500" : "bg-gray-700"}`}
                    />
                    <span onClick={() => setShowPass(!showPass)} className='absolute right-3 top-4 text-gray-300 cursor-pointer'>
                        {showPass ? <IoEye /> : <IoEyeOff />}
                    </span>

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.password}</p>
            </div>

            <button type='submit' disabled={loading} className='w-full bg-linear-to-r from-indigo-500  to-pink-500 text-white p-3 rounded-xl hover:scale-105 transition'>
                {loading ? "Proccessing..." : "Register"}
            </button>
            <div className='mt-6 text-center text-gray-400 text-sm'>
                Already have an account? <button onClick={() => switchView("login")} type='button' className='text-indigo-600 hover:text-indigo-700'>Login</button>
            </div>

        </>
    )
    const renderLoginForm = () => (
        <>
            <h2 className='text-3xl font-bold mb-6 text-center  text-white'>Welcome Back</h2>
            <p className='text-gray-300  mb-6 text-center'>Sign in to your account to continue.</p>


            {/* Email  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiMail size={24} />
                    </span>
                    <input
                        type="email"
                        name='email'
                        value={userData.email}
                        onChange={onChangeHandler}
                        placeholder='Email'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.email ? "border-red-500" : "bg-gray-700"}`}
                    />

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.email}</p>
            </div>
            {/* Password  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiLock size={24} />
                    </span>
                    <input
                        type={showPass ? 'text' : 'password'}
                        name='password'
                        value={userData.password}
                        onChange={onChangeHandler}
                        placeholder='Password'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.password ? "border-red-500" : "bg-gray-700"}`}
                    />
                    <span onClick={() => setShowPass(!showPass)} className='absolute right-3 top-4 text-gray-300 cursor-pointer'>
                        {showPass ? <IoEye /> : <IoEyeOff />}
                    </span>

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.password}</p>
            </div>
            {/* Password  */}
            <div className="mb-4 flex justify-end">
                <button type='button' onClick={() => switchView('forgot-pass')} className='text-blue-500 hover:text-blue-400'>
                    Forgot password
                </button>

            </div>

            <button type='submit' disabled={loading} className='w-full bg-linear-to-r from-indigo-500  to-pink-500 text-white p-3 rounded-xl hover:scale-105 transition'>
                {loading ? "Proccessing..." : "Login"}
            </button>
            <div className='mt-6 text-center text-gray-400 text-sm'>
                Do not have an account? <button onClick={() => switchView("register")} type='button' className='text-indigo-600 hover:text-indigo-700'>Register</button>
            </div>

        </>
    )
    const renderForgotPasswordForm = () => (
        <>
            <button type='button' onClick={() => switchView("login")} className='absolute top-2
             left-0 text-gray-300 hover:text-white'>
                <FiArrowLeft />
            </button>
            <h2 className='text-3xl font-bold mb-6 text-center  text-white'>Forgot Password</h2>
            <p className='text-gray-300  mb-6 text-center'>Enter your email to receive a reset password link.</p>


            {/* Email  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiMail size={24} />
                    </span>
                    <input
                        type="email"
                        name='email'
                        value={userData.email}
                        onChange={onChangeHandler}
                        placeholder='Email'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.email ? "border-red-500" : "bg-gray-700"}`}
                    />

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.email}</p>
            </div>



            <button type='submit' disabled={loading} className='w-full bg-linear-to-r from-indigo-500  to-pink-500 text-white p-3 rounded-xl hover:scale-105 transition'>
                {loading ? "Proccessing..." : "Send"}
            </button>
        </>
    )
    const renderResetPasswordForm = () => (
        <>
            <button type='button' onClick={() => switchView("login")} className='absolute top-2
             left-0 text-gray-300 hover:text-white'>
                <FiArrowLeft />
            </button>
            <h2 className='text-3xl font-bold mb-6 text-center  text-white'>Reset Password</h2>
            <p className='text-gray-300  mb-6 text-center'>Enter your new password and confirm password.</p>


            {/* Password  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiLock size={24} />
                    </span>
                    <input
                        type={showPass ? 'text' : 'password'}
                        name='newPassword'
                        value={userData.newPassword}
                        onChange={onChangeHandler}
                        placeholder='New Password'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.newPassword ? "border-red-500" : "bg-gray-700"}`}
                    />
                    <span onClick={() => setShowPass(!showPass)} className='absolute right-3 top-4 text-gray-300 cursor-pointer'>
                        {showPass ? <IoEye /> : <IoEyeOff />}
                    </span>

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.newPassword}</p>
            </div>
            {/* Password  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiLock size={24} />
                    </span>
                    <input
                        type={showPass ? 'text' : 'password'}
                        name='confirmPassword'
                        value={userData.confirmPassword}
                        onChange={onChangeHandler}
                        placeholder='Confirm Password'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.confirmPassword ? "border-red-500" : "bg-gray-700"}`}
                    />
                    <span onClick={() => setShowPass(!showPass)} className='absolute right-3 top-4 text-gray-300 cursor-pointer'>
                        {showPass ? <IoEye /> : <IoEyeOff />}
                    </span>

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.confirmPassword}</p>
            </div>



            <button type='submit' disabled={loading} className='w-full bg-linear-to-r from-indigo-500  to-pink-500 text-white p-3 rounded-xl hover:scale-105 transition'>
                {loading ? "Proccessing..." : "Reset Password"}
            </button>
        </>
    )


    const renderVerifyEmailForm = () => (
        <>
            <button type='button' onClick={() => switchView("login")} className='absolute top-2
             left-0 text-gray-300 hover:text-white'>
                <FiArrowLeft />
            </button>
            <h2 className='text-3xl font-bold mb-6 text-center  text-white'>Verify Email</h2>
            <p className='text-gray-300  mb-6 text-center'>Enter your OTP to verify your email.</p>


            {/* OTP  */}
            <div className="mb-4">
                <div className="relative">
                    <span className='absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400'>
                        <CiLock size={24} />
                    </span>
                    <input
                        type="text"
                        name='otp'
                        value={userData.otp}
                        onChange={onChangeHandler}
                        placeholder='Your OTP'
                        className={`w-full pl-10 pr-4 py-3  bg-gray-800  text-white border  rounded-xl focus:ring-2 focus:ring-indigo-500 ${errors.otp ? "border-red-500" : "bg-gray-700"}`}
                    />

                </div>
                <p className='text-red-500 text-xs mt-1 ml-1 h-4'>{errors.otp}</p>
            </div>



            <button type='submit' disabled={loading} className='w-full bg-linear-to-r from-indigo-500  to-pink-500 text-white p-3 rounded-xl hover:scale-105 transition'>
                {loading ? "Proccessing..." : "Submit"}
            </button>
        </>
    )


    const renderForm = () => {
        switch (authType) {
            case "login":
                return renderLoginForm();
            case "register":
                return renderRegisterForm();
            case "forgot-pass":
                return renderForgotPasswordForm();
            case "reset-pass":
                return renderResetPasswordForm();
            case "verify-email":
                return renderVerifyEmailForm();
            default:
                return renderLoginForm();
        }
    }

    return (
        <div className=" min-h-screen flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="w-full max-w-md backdrop-blur-xl  p-8 rounded-3xl shadow-2xl  ">
                <form
                    onSubmit={submitHandler}
                    className="w-full relative animate-fadeInUp "
                >
                    {renderForm()}
                </form>
            </div>
        </div>
    )
}

export default LoginPage