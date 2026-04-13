import client from './client'
import { User } from '../types'

export const register = (email: string, username: string, password: string) =>
  client.post<{ data: { user: User; token: string } }>('/auth/register', { email, username, password })

export const login = (email: string, password: string) =>
  client.post<{ data: { user: User; token: string } }>('/auth/login', { email, password })
