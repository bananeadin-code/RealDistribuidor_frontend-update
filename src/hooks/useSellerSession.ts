import { useState } from 'react'
import type { SellerSession } from '../types'

const KEY = 'rd_seller_session'

const read = (): SellerSession | null => {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function useSellerSession() {
  const [seller, setSeller] = useState<SellerSession | null>(read)

  const login = (s: SellerSession) => {
    try { sessionStorage.setItem(KEY, JSON.stringify(s)) } catch { /* sessionStorage unavailable */ }
    setSeller(s)
  }
  const logout = () => {
    try { sessionStorage.removeItem(KEY) } catch { /* sessionStorage unavailable */ }
    setSeller(null)
  }
  return { seller, login, logout }
}
