import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Signup from './pages/Auth/Signup'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import Planner from './pages/Planner/Planner'
import Wellbeing from './pages/Wellbeing/Wellbeing'
import Appointments from './pages/Appointments/Appointments'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/planner" element={<PrivateRoute><Planner /></PrivateRoute>} />
          <Route path="/wellbeing" element={<PrivateRoute><Wellbeing /></PrivateRoute>} />
          <Route path="/appointments" element={<PrivateRoute><Appointments /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/signup" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
