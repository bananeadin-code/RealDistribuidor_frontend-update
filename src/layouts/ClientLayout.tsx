import { useState }              from 'react'
import { Outlet, useNavigate }   from 'react-router-dom'
import { ToastContainer }        from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ShoppingCartIcon }      from '@heroicons/react/24/outline'
import { useShopCart }           from '../hooks/useShopCart'
import type { ShopCustomer, ShopOutletContextType } from '../types'
import ShopLoginView from '../views/client/ShopLoginView'
import Logo from '../components/Logo'

const SESSION_KEY = 'rd_shop_customer'

const readSession = (): ShopCustomer | null => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export default function ShopLayout() {
  const navigate = useNavigate()

  const [shopCustomer, setShopCustomer] = useState<ShopCustomer | null>(readSession)

  const regionFee =
    shopCustomer?.region && typeof shopCustomer.region === 'object'
      ? (shopCustomer.region.deliveryFee ?? 0)
      : 0

  const cartHook = useShopCart(regionFee)

  const handleLogin = (customer: ShopCustomer) => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(customer)) } catch { /* sessionStorage unavailable */ }
    setShopCustomer(customer)
  }

  // Muestra mini-login si no hay sesión
  if (!shopCustomer) return (
    <>
      <ShopLoginView onLogin={handleLogin} />
      <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
    </>
  )

  const context: ShopOutletContextType = {
    ...cartHook,
    shopCustomer,
    regionFee,
  }

  return (
    <div className="min-h-screen bg-blue-50/40 flex flex-col">
      <header className="bg-blue-100 border-b border-blue-200/60 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="w-28 cursor-pointer" onClick={() => navigate('/')}>
            <Logo />
          </div>
          <p className="text-xs text-[#5a7a9a] hidden sm:block truncate max-w-xs">
            Welcome, <span className="font-semibold text-[#1a3a5c]">{shopCustomer.name}</span>
          </p>
          <button
            onClick={() => navigate('/cart')}
            className="relative flex items-center gap-1.5 px-3 py-2 bg-[#185fa5]
                       hover:bg-[#0c447c] text-white rounded-xl text-sm font-semibold
                       transition-colors"
          >
            <ShoppingCartIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartHook.cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px]
                               font-bold min-w-4.5 h-4.5 rounded-full flex items-center
                               justify-center px-1 shadow">
                {cartHook.cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Outlet context={context} />
      </main>

      <footer className="py-4 border-t border-gray-200">
        <p className="text-center text-xs text-gray-400">
          All Rights Reserved {new Date().getFullYear()}.
        </p>
      </footer>

      <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
    </div>
  )
}