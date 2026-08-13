import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { wellbeingAPI } from '../../services/api'
import './Wellbeing.css'

const Wellbeing = () => {
  const [checkIns, setCheckIns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    mood: '',
    sleep_quality: '',
    stress_level: '',
    notes: '',
  })

  useEffect(() => {
    // Fetch check-ins from API
    // For now, we'll show a placeholder
    setLoading(false)
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await wellbeingAPI.checkIn(formData)
      setCheckIns([response.data, ...checkIns])
      setFormData({
        mood: '',
        sleep_quality: '',
        stress_level: '',
        notes: '',
      })
      setShowForm(false)
    } catch (err) {
      setError('Failed to save check-in')
    }
  }

  const getMoodEmoji = (mood) => {
    const moods = {
      happy: '😊',
      neutral: '😐',
      sad: '😢',
      anxious: '😰',
    }
    return moods[mood] || '😐'
  }

  return (
    <div className="wellbeing-container">
      <header className="wellbeing-header">
        <div className="header-content">
          <h1>Wellbeing Check-In</h1>
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
      </header>

      <main className="wellbeing-main">
        <section className="wellbeing-intro">
          <h2>Track Your Wellbeing</h2>
          <p>
            Take a few moments each day to check in with yourself. Track your mood, sleep quality,
            and stress levels. Your wellbeing matters, and we're here to support you.
          </p>
        </section>

        <div className="wellbeing-content">
          {error && <div className="error-message">{error}</div>}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + New Check-In
            </button>
          ) : (
            <div className="checkin-form-card">
              <h3>How are you feeling today?</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="mood">Mood *</label>
                  <div className="mood-selector">
                    {['happy', 'neutral', 'sad', 'anxious'].map(mood => (
                      <label key={mood} className="mood-option">
                        <input
                          type="radio"
                          name="mood"
                          value={mood}
                          checked={formData.mood === mood}
                          onChange={handleChange}
                        />
                        <span className="mood-emoji">{getMoodEmoji(mood)}</span>
                        <span className="mood-label">{mood.charAt(0).toUpperCase() + mood.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="sleep_quality">Sleep Quality *</label>
                  <select
                    id="sleep_quality"
                    name="sleep_quality"
                    value={formData.sleep_quality}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select sleep quality</option>
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="excellent">Excellent</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="stress_level">Stress Level *</label>
                  <div className="slider-group">
                    <input
                      type="range"
                      id="stress_level"
                      name="stress_level"
                      min="1"
                      max="10"
                      value={formData.stress_level}
                      onChange={handleChange}
                      required
                      className="stress-slider"
                    />
                    <div className="slider-labels">
                      <span>Low (1)</span>
                      <span className="stress-value">{formData.stress_level || '5'}</span>
                      <span>High (10)</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Share anything else on your mind..."
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Check-In
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {checkIns.length > 0 && (
            <div className="checkins-list">
              <h3>Your Check-In History</h3>
              {checkIns.map((checkIn, index) => (
                <div key={index} className="checkin-card">
                  <div className="checkin-header">
                    <span className="checkin-date">{checkIn.date || 'Today'}</span>
                    <span className="checkin-mood">{getMoodEmoji(checkIn.mood)}</span>
                  </div>
                  <div className="checkin-details">
                    <p><strong>Mood:</strong> {checkIn.mood}</p>
                    <p><strong>Sleep:</strong> {checkIn.sleep_quality}</p>
                    <p><strong>Stress:</strong> {checkIn.stress_level}/10</p>
                    {checkIn.notes && <p><strong>Notes:</strong> {checkIn.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {checkIns.length === 0 && !showForm && (
            <div className="empty-state">
              <p>No check-ins yet. Start by recording how you're feeling today!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Wellbeing
