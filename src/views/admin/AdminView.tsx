import { useQuery } from '@tanstack/react-query'
import { getProducts } from '../../api/ProductAPI'
import {
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShoppingBagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { QRCodeSVG } from 'qrcode.react'
import { getCustomers } from '../../api/CustomerAPI'
import { getCompletedOrders, getSales } from '../../api/SaleAPI'
import type { Sale } from '../../types'
import { useState } from 'react'

const STORE_URL = import.meta.env.VITE_STORE_URL ?? window.location.origin

type OrderItem = {
  product: { _id: string; name: string } | string
  quantity: number
  price: number      
}

type Order = {
  _id: string
  customer?: { _id: string; name: string } | string | null
  items: OrderItem[]
  total: number       
  status: string    
  paymentMethod: string
  createdAt: string   
  updatedAt: string
}

const isToday = (iso: string) => {
  const d = new Date(iso), n = new Date()
  return d.getDate() === n.getDate() &&
         d.getMonth() === n.getMonth() &&
         d.getFullYear() === n.getFullYear()
}
const fmt$ = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (iso: string) => {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
  }
}
const customerLabel = (c: Order['customer']) =>
  !c ? 'Walk-in' : typeof c === 'object' ? c.name : c

export default function DashboardView() {

  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(STORE_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const { data: orders   = [] } = useQuery<Sale[]>({
    queryKey: ['Orders'],
    queryFn:  getSales,
  })

  const { data: ordersCompleted   = [] } = useQuery<Sale[]>({
    queryKey: ['Orders-completed'],
    queryFn:  getCompletedOrders,
  })

  const { data: products = [] } = useQuery({
    queryKey: ['Products'],
    queryFn:  getProducts,
  })
  
  const { data: customers = [] } = useQuery({
    queryKey: ['Customers'],
    queryFn:  getCustomers,
  })

  const totalRevenue  = ordersCompleted.reduce((s, o) => s + (o.total ?? 0), 0)
  const totalSales    = ordersCompleted.length

  // Ventas de hoy
  const todaysOrders  = ordersCompleted.filter(o => isToday(o.updatedAt ?? ''))
  const todaysRevenue = todaysOrders.reduce((s, o) => s + (o.total ?? 0), 0)

  const totalProducts = products.length
  const lowStockCount = products.filter(p => p.stock < 30).length

  const recentSales = [...orders]
    .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
    .slice(0, 5)


  const revenueMap = new Map<string, { name: string; revenue: number }>()
  ordersCompleted.forEach(order =>
    order.items?.forEach(item => {
      const name = item.productName            
      const rev  = item.total                   
             ?? (item.unitPrice ?? 0) * (item.quantity ?? 1)
      if (!name) return
      const e = revenueMap.get(name)
      if (e) e.revenue += rev
      else revenueMap.set(name, { name, revenue: rev })
    })
  )

  const topProducts = Array.from(revenueMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // ═════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">

      {/* TÍTULO */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a5c]">Dashboard</h1>
        <p className="text-[#5a7a9a] text-sm mt-0.5">Overview of your grocery business</p>
      </div>

      {/* KPI CARDS — 1 col mobile, 2 col sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Total Revenue"
          value={`$${fmt$(totalRevenue)}`}
          sub={`${totalSales} total sales completed`}
          icon={<CurrencyDollarIcon className="w-6 h-6 text-emerald-500" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          label="Today's Sales"
          value={`$${fmt$(todaysRevenue)}`}
          sub={`${todaysOrders.length} transactions completed today`}
          icon={<ArrowTrendingUpIcon className="w-6 h-6 text-blue-500" />}
          iconBg="bg-blue-50"
        />
        <KpiCard
          label="Products"
          value={String(totalProducts)}
          sub={lowStockCount > 0 ? `${lowStockCount} low stock` : 'All stocked'}
          subColor={lowStockCount > 0 ? 'text-red-400' : 'text-gray-400'}
          icon={<ShoppingBagIcon className="w-6 h-6 text-amber-500" />}
          iconBg="bg-amber-50"
        />
        <KpiCard
          label="Customers"
          value={String(customers.length)}
          sub="Registered customers"
          icon={<UsersIcon className="w-6 h-6 text-purple-500" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* RECENT SALES */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#1a3a5c] text-lg">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-120">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {[
                  { label: 'Date',    cls: '' },
                  { label: 'Customer',cls: '' },
                  { label: 'Items',   cls: 'hidden sm:table-cell' },
                  { label: 'Payment', cls: 'hidden sm:table-cell' },
                  { label: 'Total',   cls: 'text-right' },
                  { label: 'Status',  cls: 'text-center' },
                ].map(({ label, cls }) => (
                  <th key={label}
                    className={`px-5 py-3 text-xs font-semibold text-gray-400
                                uppercase tracking-wider text-left ${cls}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400 text-sm">
                    No sales yet
                  </td>
                </tr>
              ) : recentSales.map(order => {
                const { date, time } = fmtDate(order.createdAt ?? '')
                return (
                  <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-700">{date}</div>
                      <div className="text-xs text-gray-400">{time}</div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-gray-800 whitespace-nowrap">
                      {customerLabel(order.customer)}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 hidden sm:table-cell">
                      {order.items?.length ?? 0} items
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 capitalize hidden sm:table-cell">
                      {order.paymentMethod ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-800 text-right whitespace-nowrap">
                      ${fmt$(order.total ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TOP PRODUCTS CHART */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-bold text-[#1a3a5c] text-lg">Top Products by Revenue</h2>
            <p className="text-xs text-[#5a7a9a] mt-0.5">Based on completed sales</p>
          </div>
        </div>
                  
        {topProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
            <ShoppingBagIcon className="w-8 h-8 mb-2 opacity-30" />
            No sales data yet
          </div>
        ) : (
          <div className="space-y-3">
            {topProducts.map((product, idx) => {
              const maxRevenue = topProducts[0].revenue
              const pct        = maxRevenue > 0
                ? Math.round((product.revenue / maxRevenue) * 100)
                : 0
            
              // Colores degradados de verde oscuro a claro
              const colors = [
                'bg-emerald-600',
                'bg-emerald-500',
                'bg-emerald-400',
                'bg-emerald-300',
                'bg-emerald-200',
              ]
            
              return (
                <div key={product.name} className="group">
                  <div className="flex items-center justify-between mb-1.5 gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Ranking badge */}
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center
                                        text-[10px] font-black text-white shrink-0
                                        ${idx === 0 ? 'bg-[#1a3a5c]'
                                          : idx === 1 ? 'bg-[#185fa5]'
                                          : 'bg-gray-300'}`}>
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-gray-700 truncate">
                        {product.name}
                      </p>
                    </div>
                    <p className="font-black text-[#185fa5] text-sm shrink-0">
                      ${product.revenue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                    
                  {/* Barra de progreso */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colors[idx]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR CODE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-5">
          {/* Ícono de QR (SVG inline, sin deps extra) */}
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z
                 m12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z
                 M5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z
                 M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01" />
          </svg>
          <h2 className="font-bold text-[#1a3a5c] text-lg">Store QR Code</h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* QRCodeSVG: value = URL, size = px, fgColor = color del QR */}
          <div className="p-4 rounded-2xl border-2 border-emerald-100">
            <QRCodeSVG
              value={STORE_URL}
              size={180}
              fgColor="#059669"
              bgColor="#ffffff"
              level="M"          // corrección de errores: L / M / Q / H
            />
          </div>

          {/* URL + botones */}
          <div className="flex items-center gap-2 max-w-xs">
            <p className="text-xs text-gray-400 break-all flex-1">
              {STORE_URL}
            </p>
            <button
              onClick={handleCopy}
              title="Copy URL"
              className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-emerald-600
                         hover:bg-emerald-50 transition-colors"
            >
              {copied ? (
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2
                       m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
            
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600
                       font-semibold hover:underline mt-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                   M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open store
          </a>
        </div>
      </div>

    </div>
  )
}

// ─── Sub-componentes ───────────────────────────────────────

type KpiCardProps = {
  label:    string
  value:    string
  sub:      string
  subColor?: string
  icon:     React.ReactNode
  iconBg:   string
}

function KpiCard({ label, value, sub, subColor = 'text-gray-400', icon, iconBg }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-black text-gray-900 mt-1 truncate">{value}</p>
          <p className={`text-xs mt-1 font-medium ${subColor}`}>{sub}</p>
        </div>
        <div className={`${iconBg} p-3 rounded-xl shrink-0`}>{icon}</div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    cancelled:  'bg-red-50    text-red-500    border-red-200',
    pending:    'bg-amber-50  text-amber-600  border-amber-200',
  }
  const cls = styles[status?.toLowerCase()] ?? styles.pending
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {status ?? 'pending'}
    </span>
  )
}