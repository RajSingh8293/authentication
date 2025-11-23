import React, { useEffect } from 'react'
import './App.css'
import Navbar from './componets/Navbar'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import { getUserProfile } from './redux/slices/useSlice'
import { useDispatch, useSelector } from 'react-redux'
import Home from './pages/Home'

function App() {

  const dispatch = useDispatch()

  const { user } = useSelector(state => state.user)
  console.log("user:", user);


  useEffect(() => {
    dispatch(getUserProfile())
  }, [dispatch])

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>

  )
}

export default App
