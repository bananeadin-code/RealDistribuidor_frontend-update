import { useState, useCallback } from 'react'
import type { SavedTicket } from '../types'

const KEY = 'rd_saved_tickets'

const readFromStorage = (): SavedTicket[] => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeToStorage = (tickets: SavedTicket[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(tickets))
  } catch {
    console.warn('Could not persist tickets to localStorage')
  }
}

export function useSavedTickets() {
  const [tickets, setTickets] = useState<SavedTicket[]>(readFromStorage)

  const persist = useCallback((updated: SavedTicket[]) => {
    setTickets(updated)
    writeToStorage(updated)
  }, [])

  const saveTicket = useCallback(
    (data: Omit<SavedTicket, 'id' | 'savedAt'>): SavedTicket => {
      const ticket: SavedTicket = {
        ...data,
        id:      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        savedAt: new Date().toISOString(),
      }
      persist([...readFromStorage(), ticket])
      return ticket
    },
    [persist]
  )

  const removeTicket = useCallback(
    (id: string) => persist(readFromStorage().filter(t => t.id !== id)),
    [persist]
  )

  return { tickets, saveTicket, removeTicket }
}