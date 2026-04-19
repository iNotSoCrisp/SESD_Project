import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

client.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Instead of hard-redirecting on 401 (which wipes React state and causes
// jarring full-page reloads), we dispatch a custom event. The AuthContext
// listens for this and gracefully logs the user out via React state only.
client.interceptors.response.use(
  res => res,
  err => {
    const status = err.response?.status
    if (status === 401) {
      const isAuthPage = ['/login', '/register'].some(p =>
        window.location.pathname.startsWith(p)
      )
      if (!isAuthPage) {
        // Signal the AuthContext to clear auth state.
        // This is a soft logout — no hard page refresh.
        window.dispatchEvent(new CustomEvent('auth:unauthorized'))
      }
    }
    return Promise.reject(err)
  }
)

export default client
