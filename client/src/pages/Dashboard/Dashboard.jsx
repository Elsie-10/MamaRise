import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { dashboardAPI } from '../../services/api'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const response = await dashboardAPI.getDashboard()
        setDashboardData(response.data)
      } catch (err) {
        console.error('Error fetching dashboard:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading your dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>MamaRise Dashboard</h1>
          <div className="user-menu">
            <span className="user-name">Welcome, {user?.first_name}!</span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <section className="dashboard-section">
          <h2>Your Recovery Journey</h2>
          
          <div className="welcome-card">
            <h3>Welcome back, {user?.first_name}!</h3>
            <p>Your baby was born on {user?.baby_birth_date}</p>
            <p className="subtitle">
              MamaRise is here to support you through your recovery, wellbeing, and return to work.
            </p>
          </div>

          <div className="features-grid">
            <Link to="/planner" className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Return-to-Work Planner</h3>
              <p>Create a personalized plan for your return to work with a weekly checklist</p>
              <span className="cta">Get Started →</span>
            </Link>

            <Link to="/wellbeing" className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Wellbeing Check-In</h3>
              <p>Track your mood, sleep, and stress with simple daily check-ins</p>
              <span className="cta">Check In →</span>
            </Link>

            <Link to="/appointments" className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Appointments & Milestones</h3>
              <p>Get reminders for important postpartum check-ups and milestones</p>
              <span className="cta">View Calendar →</span>
            </Link>
          </div>
        </section>

        {dashboardData?.recent_activity && (
          <section className="dashboard-section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              {dashboardData.recent_activity.length > 0 ? (
                dashboardData.recent_activity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <span className="activity-time">{activity.timestamp}</span>
                    <span className="activity-text">{activity.description}</span>
                  </div>
                ))
              ) : (
                <p className="empty-state">No recent activity yet</p>
              )}
            </div>
          </section>
        )}

        {dashboardData?.upcoming_milestones && (
          <section className="dashboard-section">
            <h2>Upcoming Milestones</h2>
            <div className="milestones-list">
              {dashboardData.upcoming_milestones.length > 0 ? (
                dashboardData.upcoming_milestones.map((milestone, index) => (
                  <div key={index} className="milestone-item">
                    <div className="milestone-date">{milestone.due_date}</div>
                    <div className="milestone-info">
                      <h4>{milestone.name}</h4>
                      <p>{milestone.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-state">No upcoming milestones</p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Dashboard
