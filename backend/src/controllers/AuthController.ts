import type { Request, Response } from 'express'
import { AuthService } from '../services/AuthService'

type Handler = (req: Request, res: Response) => Promise<Response>

export class AuthController {
  constructor(private readonly svc: AuthService) {}

  register: Handler = async (req, res) => {
    try {
      const { email, username, password } = req.body as Record<string, string>
      if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'email required' })
      if (typeof username !== 'string' || !username.trim()) return res.status(400).json({ error: 'username required' })
      if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' })
      const result = await this.svc.register(email.trim(), username.trim(), password)
      return res.status(201).json({ data: result })
    } catch (e: unknown) { return this.handleError(res, e) }
  }

  login: Handler = async (req, res) => {
    try {
      const { email, password } = req.body as Record<string, string>
      if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ error: 'email required' })
      if (typeof password !== 'string' || !password) return res.status(400).json({ error: 'password required' })
      const result = await this.svc.login(email.trim(), password)
      return res.status(200).json({ data: result })
    } catch (e: unknown) { return this.handleError(res, e) }
  }

  private handleError(res: Response, e: unknown): Response {
    if (e instanceof Error) { const sc = 'statusCode' in e ? (e as any).statusCode : 500; return res.status(sc).json({ error: e.message }) }
    return res.status(500).json({ error: 'Unexpected error' })
  }
}
