import { useState }    from 'react'
import { useMutation } from '@tanstack/react-query'
import { LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { toast }       from 'react-toastify'
import Logo            from '../../components/Logo'
import { shopLogin }   from '../../api/CustomerAPI'
import type { ShopCustomer } from '../../types'

const INPUT = `
  w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white
  text-gray-800 placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent transition
`

export default function ShopLoginView({
  onLogin,
}: {
  onLogin: (customer: ShopCustomer) => void
}) {
  const [email,      setEmail]      = useState('')
  const [accessCode, setAccessCode] = useState('')

  const loginMut = useMutation({
    mutationFn: shopLogin,
    onSuccess:  onLogin,
    onError:    () => toast.error('Invalid email or access code'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !accessCode.trim()) return
    loginMut.mutate({ email: email.trim(), accessCode: accessCode.trim() })
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-32">
            <Logo />
          </div>
          <p className="text-xs text-[#5a7a9a] text-center">
            5701 Ogden Ave, Cicero, IL 60804
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-linear-to-r from-[#185fa5] to-sky-500 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <LockClosedIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white">Customer Access</p>
                <p className="text-blue-100 text-xs mt-0.5">Enter your credentials to shop</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className={`${INPUT} pl-9`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Code
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className={`${INPUT} text-center tracking-[0.4em] font-bold text-lg`}
              />
              <p className="text-[11px] text-gray-400 mt-1 text-center">
                Your access code was provided by your distributor
              </p>
            </div>

            <button
              type="submit"
              disabled={loginMut.isPending}
              className="w-full py-3 text-sm font-semibold text-white bg-[#185fa5]
                         hover:bg-[#0c447c] disabled:opacity-60 rounded-xl transition-colors mt-2"
            >
              {loginMut.isPending ? 'Verifying...' : 'Access Store'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}