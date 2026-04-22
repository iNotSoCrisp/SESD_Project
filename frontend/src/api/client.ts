import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

client.interceptors.request.use(async config => {
  // @ts-ignore - Clerk puts itself on the window object
  const clerk = window.Clerk
  if (clerk && clerk.session) {
    const token = await clerk.session.getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
