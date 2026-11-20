import axios from 'axios'

// One axios instance for the whole app. Every request goes to /api,
// which the Vite proxy (dev) or Nginx (production) forwards to Express.
const api = axios.create({ baseURL: '/api' })

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 on a protected call means the token is missing or expired.
// Clear it and send the user to the login page.
// Login and register are skipped, so "Invalid credentials" stays on the form.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || ''
    if (err.response?.status === 401 && !url.startsWith('/auth/')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Turns any axios error into a message for the user
export function errorMessage(err, fallback = 'Something went wrong') {
  return err.response?.data?.error || fallback
}

export default api
