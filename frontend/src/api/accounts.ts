import client from './client'
import { TradingAccount } from '../types'

export const getAccounts = () =>
  client.get<{ data: TradingAccount[] }>('/accounts')

export const createAccount = (name: string, currency: string, initialBalance: number) =>
  client.post<{ data: TradingAccount }>('/accounts', { name, currency, initialBalance })
