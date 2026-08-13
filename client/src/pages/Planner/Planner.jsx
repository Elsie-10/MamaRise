import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { plannerAPI } from '../../services/api'
import './Planner.css'

const Planner = () => {
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    planned_return_date: '',
    work_type: '',
    breastfeeding_preference: '',
    childcare_arrangement: '',
  })

  useEffect(() => {
    // Fetch plans from API
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
      const response = await plannerAPI.createPlan(formData)
      setPlans([...plans, response.data])
      setFormData({
        planned_return_date: '',
        work_type: '',
        breastfeeding_preference: '',
        childcare_arrangement: '',
      })
      setShowForm(false)
    } catch (err) {
      setError('Failed to create plan')
    }
  }

  return (
    <div className="planner-container">
      <header className="planner-header">
        <div className="header-content">
          <h1>Return-to-Work Planner</h1>
          <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        </div>
      </header>

      <main className="planner-main">
        <section className="planner-intro">
          <h2>Your Personalized Return-to-Work Plan</h2>
          <p>
            Create a customized plan based on your work type, return date, and personal needs.
            We'll generate a weekly preparation checklist to help you prepare for your return.
          </p>
        </section>

        <div className="planner-content">
          {error && <div className="error-message">{error}</div>}

          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + Create New Plan
            </button>
          ) : (
            <div className="plan-form-card">
              <h3>Create Your Return-to-Work Plan</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="planned_return_date">Planned Return Date *</label>
                  <input
                    type="date"
                    id="planned_return_date"
                    name="planned_return_date"
                    value={formData.planned_return_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="work_type">Type of Work *</label>
                  <select
                    id="work_type"
                    name="work_type"
                    value={formData.work_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select work type</option>
                    <option value="formal_employment">Formal Employment</option>
                    <option value="self_employment">Self-Employment</option>
                    <option value="gig_work">Gig Work</option>
                    <option value="farming">Farming</option>
                    <option value="trading">Trading</option>
                    <option value="remote_work">Remote Work</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="breastfeeding_preference">Breastfeeding Preference *</label>
                  <select
                    id="breastfeeding_preference"
                    name="breastfeeding_preference"
                    value={formData.breastfeeding_preference}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select preference</option>
                    <option value="exclusive_breastfeeding">Exclusive Breastfeeding</option>
                    <option value="mixed_feeding">Mixed Feeding</option>
                    <option value="formula_feeding">Formula Feeding</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="childcare_arrangement">Childcare Arrangement *</label>
                  <select
                    id="childcare_arrangement"
                    name="childcare_arrangement"
                    value={formData.childcare_arrangement}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select arrangement</option>
                    <option value="daycare">Daycare</option>
                    <option value="family_care">Family Care</option>
                    <option value="nanny">Nanny</option>
                    <option value="home_based">Home-Based Care</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Create Plan
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

          {plans.length > 0 && (
            <div className="plans-list">
              <h3>Your Plans</h3>
              {plans.map((plan, index) => (
                <div key={index} className="plan-card">
                  <h4>{plan.name}</h4>
                  <p>Return Date: {plan.planned_return_date}</p>
                  <p>Work Type: {plan.work_type}</p>
                  <button className="btn btn-small">View Checklist</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Planner
