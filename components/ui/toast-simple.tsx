"use client"
import { useState, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'loading'
export type ToastMessage = { id: string, message: string, type: ToastType, duration?: number }

let _setToast: ((t: ToastMessage | null) => void) | null = null

export function toast(message: string, type: ToastType = 'info', duration = 4000) {
  if (_setToast) _setToast({ id: Math.random().toString(), message, type, duration })
}

export function ToastContainer() {
  const [current, setCurrent] = useState<ToastMessage | null>(null)
  useEffect(() => { _setToast = setCurrent }, [])
  useEffect(() => {
    if (current && current.duration) {
      const t = setTimeout(() => setCurrent(null), current.duration)
      return () => clearTimeout(t)
    }
  }, [current])
  if (!current) return null
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500', info: 'bg-[var(--color-blue)]', loading: 'bg-[var(--color-blue)]' }
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white shadow-lg ${colors[current.type]}`}>
      {current.type === 'loading' && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
      {current.message}
    </div>
  )
}
