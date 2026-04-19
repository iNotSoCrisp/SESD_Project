import client from './client'
import type { TradingAccount } from '../types'

export const getAccounts = async () => {
  let res = await client.get<{ data: TradingAccount[] }>('/accounts')
  if (res.data.data.length === 0) {
    // Auto-initialize 100k test account
    await createAccount('Paper Trading', 'USD', 100000)
    res = await client.get<{ data: TradingAccount[] }>('/accounts')
  }
  return res
}

export const createAccount = (name: string, currency: string, initialBalance: number) =>
  client.post<{ data: TradingAccount }>('/accounts', { name, currency, initialBalance })

export const resetAccount = () => client.post<{ data: { success: boolean } }>('/accounts/reset')
