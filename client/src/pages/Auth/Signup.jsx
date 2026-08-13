import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const Signup = () => {
  const navigate = useNavigate()
  const { signup } = useAuth()
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    baby_birth_date: '',
    accept_terms: false,
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required'
    } else if (!/^[\d\s+\-()]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = 'Please confirm your password'
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match'
    }

    if (!formData.baby_birth_date) {
      newErrors.baby_birth_date = 'Baby birth date is required'
    }

    if (!formData.accept_terms) {
      newErrors.accept_terms = 'You must accept the terms and conditions'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const signupData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        baby_birth_date: formData.baby_birth_date,
      }

      await signup(signupData)
      navigate('/dashboard')
    } catch (error) {
      console.error('Signup error:', error)
      if (typeof error === 'object' && error.message) {
        setServerError(error.message)
      } else if (typeof error === 'string') {
        setServerError(error)
      } else {
        setServerError('An error occurred during signup. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>MamaRise</h1>
          <p className="tagline">Rise After Birth. Rise Into Everything Next.</p>
        </div>

        <div className="auth-content">
          <h2>Create Your Account</h2>
          <p className="subtitle">Start your journey to recovery and return to work</p>

          {serverError && (
            <div className="error-message alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? 'input-error' : ''}
                  placeholder="Enter your first name"
                />
                {errors.first_name && (
                  <span className="field-error">{errors.first_name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? 'input-error' : ''}
                  placeholder="Enter your last name"
                />
                {errors.last_name && (
                  <span className="field-error">{errors.last_name}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'input-error' : ''}
                placeholder="Enter your email"
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone_number">Phone Number *</label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className={errors.phone_number ? 'input-error' : ''}
                placeholder="Enter your phone number"
              />
              {errors.phone_number && (
                <span className="field-error">{errors.phone_number}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="baby_birth_date">Baby's Birth Date *</label>
              <input
                type="date"
                id="baby_birth_date"
                name="baby_birth_date"
                value={formData.baby_birth_date}
                onChange={handleChange}
                className={errors.baby_birth_date ? 'input-error' : ''}
              />
              {errors.baby_birth_date && (
                <span className="field-error">{errors.baby_birth_date}</span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirm_password">Confirm Password *</label>
                <input
                  type="password"
                  id="confirm_password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={errors.confirm_password ? 'input-error' : ''}
                  placeholder="Confirm your password"
                />
                {errors.confirm_password && (
                  <span className="field-error">{errors.confirm_password}</span>
                )}
              </div>
            </div>

            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="accept_terms"
                name="accept_terms"
                checked={formData.accept_terms}
                onChange={handleChange}
              />
              <label htmlFor="accept_terms">
                I accept the <a href="#terms">Terms and Conditions</a> and <a href="#privacy">Privacy Policy</a> *
              </label>
              {errors.accept_terms && (
                <span className="field-error">{errors.accept_terms}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-large"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in here</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup
