import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { appointmentsAPI } from '../../services/api'
import './Appointments.css'

const Appointments = () => {
  const [appointments, setAppointments] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    appointment_type: '',
    date: '',
    time: '',
    location: '',
    notes: '',
  })

  const defaultMilestones = [
    {
      id: 1,
      name: 'Six-Week Postpartum Check-up',
      description: 'Physical recovery assessment',
      expected_date: '6 weeks after birth',
      icon: '🏥'
    },
    {
      id: 2,
      name: 'Three-Month Follow-up',
      description: 'Mental health and wellbeing check',
      expected_date: '3 months after birth',
      icon: '💚'
    },
    {
      id: 3,
      name: 'Six-Month Follow-up',
      description: 'Overall recovery and adjustment check',
      expected_date: '6 months after birth',
      icon: '📋'
    },
    {
      id: 4,
      name: 'Family Planning Appointment',
      description: 'Discuss contraception options',
      expected_date: 'As needed',
      icon: '👨‍👩‍👧‍👦'
    }
  ]

  useEffect(() => {
    // Fetch appointments and milestones from API
    // For now, we'll use default milestones
    setMilestones(defaultMilestones)
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
      const response = await appointmentsAPI.createAppointment(formData)
      setAppointments([response.data, ...appointments])
      setFormData({
        appointment_type: '',
        date: '',
        time: '',
        location: '',
        notes: '',
      })
      setShowForm(false)
    } catch (err) {
      setError('Failed to create appointment')
    }
  }

  const getStatusBadge = (date) => {
    const appointmentDate = new Date(date)
    const today = new Date()
    if (appointmentDate < today) {
      return <span className="status-badge completed">Completed</span>
    }
    return <span className="status-badge upcoming">Upcoming</span>
  }

  return (
    <div className="appointments-container">
      <header className="appointments-header">
        <div className="header-content">
          <h1>Appointments & Milestones</h1>
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
      </header>

      <main className="appointments-main">
        <section className="appointments-intro">
          <h2>Important Postpartum Milestones</h2>
          <p>
            Regular check-ups and appointments are an important part of your postpartum recovery.
            Below are key milestones to keep track of during your first year after birth.
          </p>
        </section>

        <div className="appointments-content">
          {error && <div className="error-message">{error}</div>}

          {/* Milestones Section */}
          <section className="milestones-section">
            <h3>Postpartum Milestones</h3>
            <div className="milestones-grid">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="milestone-card">
                  <div className="milestone-icon">{milestone.icon}</div>
                  <h4>{milestone.name}</h4>
                  <p className="milestone-desc">{milestone.description}</p>
                  <p className="milestone-date">📅 {milestone.expected_date}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Appointments Section */}
          <section className="appointments-section">
            <div className="section-header">
              <h3>Your Appointments</h3>
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-primary"
                >
                  + Add Appointment
                </button>
              )}
            </div>

            {showForm && (
              <div className="appointment-form-card">
                <h4>Schedule New Appointment</h4>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="appointment_type">Appointment Type *</label>
                    <select
                      id="appointment_type"
                      name="appointment_type"
                      value={formData.appointment_type}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select type</option>
                      <option value="postpartum_checkup">Postpartum Check-up</option>
                      <option value="family_planning">Family Planning</option>
                      <option value="mental_health">Mental Health</option>
                      <option value="lactation">Lactation Consultation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="date">Date *</label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="time">Time *</label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location / Provider *</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Clinic name or healthcare provider"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Any additional notes or questions..."
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                      Schedule Appointment
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

            {appointments.length > 0 ? (
              <div className="appointments-list">
                {appointments.map((appointment, index) => (
                  <div key={index} className="appointment-card">
                    <div className="appointment-header">
                      <div>
                        <h4>{appointment.appointment_type}</h4>
                        <p className="appointment-provider">{appointment.location}</p>
                      </div>
                      {getStatusBadge(appointment.date)}
                    </div>
                    <div className="appointment-details">
                      <p><strong>📅 Date:</strong> {appointment.date}</p>
                      <p><strong>🕐 Time:</strong> {appointment.time}</p>
                      {appointment.notes && <p><strong>📝 Notes:</strong> {appointment.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No appointments scheduled yet. Add your first appointment above!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

export default Appointments
