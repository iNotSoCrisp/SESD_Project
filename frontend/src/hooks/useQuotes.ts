import { useState, useEffect, useRef } from 'react'
import { STOCKS, CRYPTO } from '../data/watchlist'
import { getAllQuotes } from '../services/finnhub'
import type { QuoteExtended } from '../services/finnhub'

export function useQuotes() {
  const [stocks, setStocks] = useState<QuoteExtended[]>([])
  const [crypto, setCrypto] = useState<QuoteExtended[]>([])
  
  const [loadingStocks, setLoadingStocks] = useState(true)
  const [loadingCrypto, setLoadingCrypto] = useState(true)
  
  const [rateLimitActive, setRateLimitActive] = useState(false)
  const [rateLimitTimer, setRateLimitTimer] = useState(0)

  const isFetchingStocks = useRef(false)
  const isFetchingCrypto = useRef(false)
  
  const fetchStocks = async () => {
    if (isFetchingStocks.current || rateLimitActive) return
    isFetchingStocks.current = true
    try {
      const data = await getAllQuotes(STOCKS)
      setStocks(data)
    } catch (e: any) {
      if (e.response?.status === 429) triggerRateLimit()
    } finally {
      setLoadingStocks(false)
      isFetchingStocks.current = false
    }
  }

  const fetchCrypto = async () => {
    if (isFetchingCrypto.current || rateLimitActive) return
    isFetchingCrypto.current = true
    try {
      const data = await getAllQuotes(CRYPTO)
      setCrypto(data)
    } catch (e: any) {
      if (e.response?.status === 429) triggerRateLimit()
    } finally {
      setLoadingCrypto(false)
      isFetchingCrypto.current = false
    }
  }

  const triggerRateLimit = () => {
    if (rateLimitActive) return
    setRateLimitActive(true)
    setRateLimitTimer(60)
    
    let left = 60
    const intv = setInterval(() => {
      left -= 1
      setRateLimitTimer(left)
      if (left <= 0) {
        clearInterval(intv)
        setRateLimitActive(false)
      }
    }, 1000)
  }

  // Initial fetch
  useEffect(() => {
    fetchStocks()
    fetchCrypto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Intervals
  useEffect(() => {
    if (rateLimitActive) return
    
    const stockInterval = setInterval(fetchStocks, 90000) // 90s
    const cryptoInterval = setInterval(fetchCrypto, 30000) // 30s
    
    return () => {
      clearInterval(stockInterval)
      clearInterval(cryptoInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rateLimitActive])

  return {
    stocks,
    crypto,
    loadingStocks,
    loadingCrypto,
    rateLimitActive,
    rateLimitTimer,
    refreshStocks: fetchStocks,
    refreshCrypto: fetchCrypto
  }
}
