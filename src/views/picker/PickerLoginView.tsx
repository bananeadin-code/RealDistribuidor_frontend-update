import { useState }    from 'react'
import { useMutation } from '@tanstack/react-query'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { toast }       from 'react-toastify'
import Logo            from '../../components/Logo'
import { pickerLogin } from '../../api/PickerAPI'
import type { PickerSession } from '../../types'

export default function PickerLoginView({
  onLogin,
}: {
  onLogin: (p: PickerSession) => void
}) {
  const [code, setCode] = useState('')

  const loginMut = useMutation({
    mutationFn: pickerLogin,
    onSuccess:  onLogin,
    onError:    () => toast.error('Invalid access code'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    loginMut.mutate(code.trim())
  }

  return (
    <div className="min-h-screen bg-[#1a3a5c] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-32 bg-white rounded-2xl p-3">
            <Logo />
          </div>
          <p className="text-white/70 text-sm">Picker Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-3">
              <LockClosedIcon className="w-6 h-6 text-[#185fa5]" />
            </div>
            <p className="font-bold text-[#1a3a5c] text-lg">Enter your code</p>
            <p className="text-xs text-gray-400 mt-1">
              Use the access code provided by your manager
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-4 text-center text-2xl font-bold tracking-[0.5em]
                         border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
            />
            <button
              type="submit"
              disabled={loginMut.isPending}
              className="w-full py-3.5 text-sm font-semibold text-white bg-[#185fa5]
                         hover:bg-[#0c447c] disabled:opacity-60 rounded-xl transition-colors"
            >
              {loginMut.isPending ? 'Verifying...' : 'Enter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}