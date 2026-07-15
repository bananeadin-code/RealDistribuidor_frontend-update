import { useState } from 'react'
import type { PickerSession } from '../types'

const KEY = 'rd_picker_session'

const read = (): PickerSession | null => {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function usePickerSession() {
  const [picker, setPicker] = useState<PickerSession | null>(read)

  const login = (p: PickerSession) => {
    try { sessionStorage.setItem(KEY, JSON.stringify(p)) } catch { /* sessionStorage unavailable */ }
    setPicker(p)
  }
  const logout = () => {
    try { sessionStorage.removeItem(KEY) } catch { /* sessionStorage unavailable */ }
    setPicker(null)
  }
  return { picker, login, logout }
}