import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingCartIcon, UsersIcon, ClockIcon, TrashIcon,
  PhoneIcon, MapPinIcon, UserIcon,
} from '@heroicons/react/24/outline'
import { getMyCustomers, getMySellerOrders } from '../../api/SellerAPI'
import { sellerLabel } from '../../types'
import type { Customer, Sale, SaleStatus, SellerSession } from '../../types'
import SaleBuilder from '../../components/sales/SaleBuilder'

const historyClearedKey = (sellerId: string) => `rd_seller_history_cleared_${sellerId}`

const shortId = (id: string) => id.slice(-6).toUpperCase()

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

const customerLabel = (c: Sale['customer']) =>
  c && typeof c === 'object' ? c.name : 'Walk-in Customer'

const STATUS_CFG: Record<SaleStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50   text-amber-600   border-amber-200'  },
  fulfilled: { label: 'Fulfilled', cls: 'bg-purple-50  text-purple-600  border-purple-200' },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  refunded:  { label: 'Refunded',  cls: 'bg-blue-50    text-blue-600    border-blue-200'    },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50     text-red-500     border-red-200'     },
}

function StatusBadge({ status }: { status: SaleStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pending
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Tab: My Customers ─────────────────────────────────────────────────────────
function CustomersTab({ customers }: { customers: Customer[] }) {
  if (customers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <UsersIcon className="w-7 h-7 text-[#185fa5]/40" />
      </div>
      <p className="text-gray-400 text-sm">No customers assigned to you yet</p>
    </div>
  )
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {customers.map(c => (
        <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center
                            justify-center shrink-0 border-2 border-emerald-200">
              <UserIcon className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-gray-800 text-sm truncate">{c.name}</p>
              {c.phone && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-gray-400" /> {c.phone}
                </p>
              )}
              {c.region && typeof c.region === 'object' && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <MapPinIcon className="w-3.5 h-3.5 text-gray-400" />
                  [{c.region.regionCode}] {c.region.regionName}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Tab: History ──────────────────────────────────────────────────────────────
function HistoryTab({
  orders, onClear,
}: {
  orders:  Sale[]
  onClear: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={onClear}
          disabled={orders.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                     text-red-500 bg-red-50 hover:bg-red-100 border border-red-200
                     disabled:opacity-40 rounded-lg transition-colors"
        >
          <TrashIcon className="w-3.5 h-3.5" /> Clear History
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <ClockIcon className="w-7 h-7 text-[#185fa5]/40" />
          </div>
          <p className="text-gray-400 text-sm">No orders registered yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(order => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div>
                  <p className="text-xs text-gray-400 font-mono">#{shortId(order._id)}</p>
                  <p className="font-bold text-[#1a3a5c] text-sm mt-0.5">
                    {customerLabel(order.customer)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{fmtDateTime(order.createdAt)} · {order.items.length} items</span>
                <span className="font-bold text-[#185fa5] text-sm">${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function SellerDashboardView({ seller }: { seller: SellerSession }) {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<'sale' | 'customers' | 'history'>('sale')

  const [clearedAt, setClearedAt] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem(historyClearedKey(seller._id))
      return raw ? Number(raw) : 0
    } catch { return 0 }
  })

  const { data: myCustomers = [] } = useQuery<Customer[]>({
    queryKey: ['SellerCustomers', seller._id],
    queryFn:  () => getMyCustomers(seller._id),
  })

  const { data: myOrders = [] } = useQuery<Sale[]>({
    queryKey: ['SellerOrders', seller._id],
    queryFn:  () => getMySellerOrders(seller._id),
  })

  const visibleOrders = myOrders.filter(
    o => new Date(o.createdAt ?? 0).getTime() > clearedAt
  )

  const handleClearHistory = () => {
    if (!window.confirm(
      "Clear your order history view? This only hides it from your screen — the orders themselves stay on record."
    )) return
    const now = Date.now()
    try { sessionStorage.setItem(historyClearedKey(seller._id), String(now)) } catch { /* unavailable */ }
    setClearedAt(now)
  }

  const TABS = [
    { key: 'sale' as const,      label: 'New Sale',      icon: ShoppingCartIcon, count: null },
    { key: 'customers' as const, label: 'My Customers',  icon: UsersIcon,        count: myCustomers.length },
    { key: 'history' as const,   label: 'History',       icon: ClockIcon,        count: visibleOrders.length },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#1a3a5c]">Hello, {seller.name}</h1>
        <p className="text-sm text-[#5a7a9a] mt-0.5">
          Seller #{String(seller.sellerNumber).padStart(4, '0')} · {myCustomers.length} customers assigned
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all
                        flex items-center justify-center gap-1.5
                        ${tab === key ? 'bg-white text-[#1a3a5c] shadow-sm' : 'text-gray-500'}`}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            {count !== null && <span>({count})</span>}
          </button>
        ))}
      </div>

      {tab === 'sale' && (
        <SaleBuilder
          customers={myCustomers}
          showStock={false}
          seller={{ id: seller._id, name: sellerLabel(seller) }}
          onSaleCreated={() => queryClient.invalidateQueries({ queryKey: ['SellerOrders', seller._id] })}
        />
      )}

      {tab === 'customers' && <CustomersTab customers={myCustomers} />}

      {tab === 'history' && <HistoryTab orders={visibleOrders} onClear={handleClearHistory} />}
    </div>
  )
}
