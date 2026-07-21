import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useState } from 'react'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CubeIcon,
  MapPinIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  TruckIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  ClockIcon,
  BellAlertIcon,
  BriefcaseIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getProducts } from '../api/ProductAPI'
import { getPendingCount } from '../api/SaleAPI'
import { logout } from '../api/AuthAPI'

// ─── Agrega aquí nuevos módulos cuando los necesites ──────
const NAV_LINKS = [
  { label: 'Dashboard',          path: '/admin-view-privated',                  icon: HomeIcon                                       },
  { label: 'New Sale',           path: '/admin-view-privated/new-sale',         icon: ShoppingCartIcon                              },
  { label: 'Pending Orders',     path: '/admin-view-privated/pending-orders',   icon: ClockIcon,                  showPending: true  },
  { label: 'Products',           path: '/admin-view-privated/products',         icon: CubeIcon,                   showLowStock: true },
  { label: 'Pickers',            path: '/admin-view-privated/pickers',          icon: UserGroupIcon                                 },
  { label: 'Sellers',            path: '/admin-view-privated/sellers',          icon: BriefcaseIcon                                 },
  { label: 'Suppliers',          path: '/admin-view-privated/suppliers',        icon: TruckIcon                                     },
  { label: 'Purchase Orders',    path: '/admin-view-privated/purchase-orders',  icon: ClipboardDocumentCheckIcon                    },
  { label: 'Sales History',      path: '/admin-view-privated/orders',           icon: ClipboardDocumentListIcon                     },
  { label: 'Region Fees',        path: '/admin-view-privated/manage-regions',   icon: MapPinIcon                                    },
  { label: 'Customers',          path: '/admin-view-privated/customers',        icon: UsersIcon                                     },
  { label: 'Add Administrator',  path: '/admin-view-privated/create-admin',     icon: UserPlusIcon                                  },
]

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const location        = useLocation()
  const navigate        = useNavigate()
  const queryClient     = useQueryClient()

  // Todos los hooks siempre al tope (regla de React)
  const { data: admin, isError, isLoading } = useAuth()

  const handleLogout = () => {
    logout()
    queryClient.clear()
    setOpen(false)
    navigate('/admin-view-privated/login')
  }

  const { data: products } = useQuery({
    queryKey: ['Products'],
    queryFn:  getProducts,
    enabled:  !!admin,
  })

  const { data: pendingData } = useQuery({
    queryKey: ['pending-count'],
    queryFn:  getPendingCount,
    enabled:  !!admin,
    refetchInterval: 30000,   // chequea cada 30s
  })
  const newOrdersCount = pendingData?.count ?? 0

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading...</p>
    </div>
  )

  if (isError) return <Navigate to="/admin-view-privated/login" />

  const hasLowStock = products?.some(p => p.stock < 15) ?? false

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* ═══ SIDEBAR DRAWER (Headless UI v2) ═══════════════════════════════════ */}
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">

        {/* Overlay con blur */}
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm
                     transition-opacity duration-300 ease-in-out
                     data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="flex w-72 max-w-[85vw] flex-col bg-[#1a3a5c] shadow-2xl
                       transition-transform duration-300 ease-in-out
                       data-closed:-translate-x-full"
          >
            {/* Logo + botón cerrar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="w-28">
                <Logo />
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white
                           hover:bg-white/10 transition-colors"
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Dirección en el sidebar */}
            <div className="px-4 py-2.5 border-b border-white/10 text-center">
              <p className="text-[10px] text-white/40 leading-relaxed">
                5701 Ogden Ave, Cicero, IL 60804<br />
                TEL: (630)-215-6252
              </p>
            </div>

            {/* Info del administrador */}
            {admin && (
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">
                  Administrator
                </p>
                <p className="text-white font-semibold text-sm mt-0.5 truncate">
                  {admin.name}
                </p>
              </div>
            )}

            {/* Links de navegación */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {NAV_LINKS.map(({ label, path, icon: Icon, showLowStock, showPending }) => {
                const isActive = location.pathname === path
                const badge    = showLowStock
                  ? (hasLowStock ? '!' : null)
                  : showPending
                  ? (newOrdersCount > 0 ? newOrdersCount : null)
                  : null

                return (
                  <Link
                    key={path}
                    to={path}
                    onClick={() => setOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl
                                text-sm font-medium transition-all
                                ${isActive
                                  ? 'bg-white text-[#1a3a5c] shadow-sm'
                                  : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="truncate">{label}</span>
                    {badge !== null && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold
                                       px-1.5 py-0.5 rounded-full min-w-4.5 text-center leading-none">
                        {badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Log out */}
            <div className="px-3 py-3 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl
                           text-sm font-medium text-red-300 hover:bg-red-500/10
                           hover:text-red-200 transition-all"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                <span>Log out</span>
              </button>
            </div>

            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-[10px] text-white/30 text-center">
                © {new Date().getFullYear()} Real Distribuidor
              </p>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* ═══ HEADER ═════════════════════════════════════════════════════════════ */}
      <header className="bg-blue-100 border-b border-blue-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Botón menú */}
            <button
              onClick={() => setOpen(true)}
              className="p-2 rounded-lg text-[#1a3a5c] hover:bg-blue-200 transition-colors"
              aria-label="Open menu"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>

            {/* Logo */}
            <div className="w-28">
              <Link to="/admin-view-privated"><Logo /></Link>
            </div>

            {/* Campanita de órdenes nuevas */}
            {newOrdersCount > 0 ? (
              <button
                onClick={() => navigate('/admin-view-privated/pending-orders')}
                className="relative p-2 rounded-lg text-[#1a3a5c] hover:bg-blue-200 transition-colors"
                title={`${newOrdersCount} store orders`}
              >
                <BellAlertIcon className="w-6 h-6" />
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px]
                                 font-bold min-w-4.5 h-4.5 rounded-full flex items-center
                                 justify-center px-1 animate-pulse">
                  {newOrdersCount}
                </span>
              </button>
            ) : (
              <div className="w-10" />   /* spacer para mantener el logo centrado */
            )}
          </div>

          {/* Dirección debajo del logo */}
          <div className="pb-2.5 text-center">
            <p className="text-[11px] text-[#1a3a5c]/55 font-medium tracking-wide">
              5701 Ogden Ave, Cicero, IL 60804 &nbsp;·&nbsp; TEL: (630)-215-6252
            </p>
          </div>
        </div>
      </header>

      {/* ═══ CONTENIDO PRINCIPAL ════════════════════════════════════════════════ */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
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