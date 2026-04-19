import type { Request, Response } from 'express'
import type { IAccountRepository } from '../repositories/AccountRepository'

type Handler = (req: Request, res: Response) => Promise<Response>

export class AccountController {
  constructor(private readonly repo: IAccountRepository) {}

  listAccounts: Handler = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
    const accounts = await this.repo.findByUserId(req.user.userId)
    return res.status(200).json({ data: accounts })
  }

  createAccount: Handler = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
    const b = req.body as Record<string, unknown>
    const name = typeof b.name === 'string' && b.name.trim() ? b.name.trim() : undefined
    const currency = typeof b.currency === 'string' && b.currency.trim() ? b.currency.trim() : 'USD'
    const balance = typeof b.initialBalance === 'number' && !Number.isNaN(b.initialBalance) ? b.initialBalance : 0
    if (!name) return res.status(400).json({ error: 'name required' })
    const account = await this.repo.create({ userId: req.user.userId, name, currency, balance })
    return res.status(201).json({ data: account })
  }

  resetWallet: Handler = async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' })
    // We get the first account. Because it's a simple app, we assume they have 1 paper trading account.
    const accounts = await this.repo.findByUserId(req.user.userId)
    const primary = accounts[0]
    if (!primary) return res.status(404).json({ error: 'No account found' })
    await this.repo.resetWallet(primary.id)
    return res.status(200).json({ data: { success: true } })
  }
}
