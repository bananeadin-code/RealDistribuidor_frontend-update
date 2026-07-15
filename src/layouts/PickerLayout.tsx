import { useNavigate }      from 'react-router-dom'
import { ToastContainer }   from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import Logo                 from '../components/Logo'
import { usePickerSession } from '../hooks/usePickerSession'
import PickerLoginView      from '../views/picker/PickerLoginView'
import PickerDashboardView  from '../views/picker/PickerDashboardView'

export default function PickerLayout() {
  const navigate = useNavigate()
  const { picker, login, logout } = usePickerSession()

  if (!picker) return (
    <>
      <PickerLoginView onLogin={login} />
      <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
    </>
  )

  return (
    <div className="min-h-screen bg-blue-50/40 flex flex-col">
      <header className="bg-[#1a3a5c] shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-24 bg-white/95 rounded-lg p-1">
              <Logo />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Picker Portal</p>
              <p className="text-white/60 text-xs">{picker.name}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/picker') }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                       text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        <PickerDashboardView picker={picker} />
      </main>

      <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
    </div>
  )
}