import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if it exists
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  signup: (data) => apiClient.post('/auth/signup', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: () => apiClient.post('/auth/refresh'),
}

export const plannerAPI = {
  createPlan: (data) => apiClient.post('/planner/plans', data),
  getPlan: (planId) => apiClient.get(`/planner/plans/${planId}`),
  updatePlan: (planId, data) => apiClient.put(`/planner/plans/${planId}`, data),
  getChecklist: (planId) => apiClient.get(`/planner/plans/${planId}/checklist`),
  updateChecklist: (planId, data) => apiClient.put(`/planner/plans/${planId}/checklist`, data),
}

export const wellbeingAPI = {
  checkIn: (data) => apiClient.post('/wellbeing/check-ins', data),
  getCheckIns: () => apiClient.get('/wellbeing/check-ins'),
  getCheckIn: (checkInId) => apiClient.get(`/wellbeing/check-ins/${checkInId}`),
}

export const appointmentsAPI = {
  getAppointments: () => apiClient.get('/appointments'),
  getAppointment: (appointmentId) => apiClient.get(`/appointments/${appointmentId}`),
  createAppointment: (data) => apiClient.post('/appointments', data),
  updateAppointment: (appointmentId, data) => apiClient.put(`/appointments/${appointmentId}`, data),
  getMilestones: () => apiClient.get('/appointments/milestones'),
}

export const dashboardAPI = {
  getDashboard: () => apiClient.get('/dashboard'),
  getUserProfile: () => apiClient.get('/dashboard/profile'),
  updateUserProfile: (data) => apiClient.put('/dashboard/profile', data),
}

export default apiClient
