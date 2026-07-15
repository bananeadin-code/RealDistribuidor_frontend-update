import { useState }                              from 'react'
import { useQuery, useMutation, useQueryClient }  from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }    from '@headlessui/react'
import {
  MagnifyingGlassIcon, EyeIcon, XMarkIcon,
  XCircleIcon, UserIcon, ClockIcon,
  ShoppingBagIcon, BuildingStorefrontIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import { getPendingOrders, updateSaleStatus } from '../../api/SaleAPI'
import type { Sale } from '../../types'

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}
const shortId       = (id: string) => id.slice(-6).toUpperCase()
const customerLabel = (c: Sale['customer']) => c && typeof c === 'object' ? c.name : 'Walk-in Customer'
const pickerLabel   = (p: Sale['picker']) => p && typeof p === 'object' ? p.name : null

// ─── Detail modal ──────────────────────────────────────────────────────────────
function PendingDetailModal({
  order, onClose, onCancel, cancelling,
}: {
  order:      Sale | null
  onClose:    () => void
  onCancel:   (id: string) => void
  cancelling: boolean
}) {
  return (
    <Dialog open={!!order} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel transition
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl
                     flex flex-col max-h-[90vh] transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:data-closed:scale-95 sm:data-closed:opacity-0">
          {order && (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <p className="font-black text-[#1a3a5c] text-lg">Order #{shortId(order._id)}</p>
                  <p className="text-xs text-[#5a7a9a]">{fmtDateTime(order.createdAt)}</p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">{customerLabel(order.customer)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Source</p>
                    <p className="font-semibold text-gray-700 text-sm mt-0.5 capitalize flex items-center gap-1">
                      {order.source === 'shop'
                        ? <><BuildingStorefrontIcon className="w-3.5 h-3.5" /> Store</>
                        : <><ShoppingBagIcon className="w-3.5 h-3.5" /> Admin</>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Assigned Picker</p>
                    {pickerLabel(order.picker) ? (
                      <p className="font-semibold text-emerald-600 text-sm mt-0.5 flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />{pickerLabel(order.picker)}
                      </p>
                    ) : (
                      <p className="font-semibold text-amber-500 text-sm mt-0.5">Unassigned</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Items</p>
                    <p className="font-semibold text-gray-700 text-sm mt-0.5">{order.items.length}</p>
                  </div>
                </div>

                {/* Items requested */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Requested</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {order.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-3 font-semibold text-gray-800 text-xs">{item.productName}</td>
                          <td className="px-3 py-3 text-right text-gray-600 text-xs">{item.quantity}</td>
                          <td className="px-3 py-3 text-right text-gray-600 text-xs">${item.unitPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {order.notes && (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
                    {order.notes}
                  </div>
                )}

                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-semibold text-[#1a3a5c] text-sm">Estimated Total</p>
                  <p className="font-black text-[#185fa5] text-xl">${order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                <button onClick={() => onCancel(order._id)} disabled={cancelling}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5
                             text-sm font-semibold text-red-500 bg-red-50 hover:bg-red-100
                             border border-red-200 disabled:opacity-50 rounded-xl transition-colors">
                  <XCircleIcon className="w-4 h-4" />
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Order card ────────────────────────────────────────────────────────────────
function PendingCard({ order, onView }: { order: Sale; onView: () => void }) {
  const picker = pickerLabel(order.picker)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs text-gray-400 font-mono">#{shortId(order._id)}</p>
          <p className="font-bold text-[#1a3a5c] text-sm mt-0.5">{customerLabel(order.customer)}</p>
        </div>
        {order.source === 'shop' && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600
                           border border-purple-200 font-semibold flex items-center gap-0.5">
            <BuildingStorefrontIcon className="w-3 h-3" /> Store
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs mb-3">
        <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-gray-500">{fmtDateTime(order.createdAt)}</span>
      </div>

      {/* Picker status */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-3
                       ${picker ? 'bg-emerald-50 border border-emerald-100'
                                : 'bg-amber-50 border border-amber-100'}`}>
        <UserIcon className={`w-4 h-4 ${picker ? 'text-emerald-500' : 'text-amber-500'}`} />
        <span className={`text-xs font-semibold ${picker ? 'text-emerald-700' : 'text-amber-600'}`}>
          {picker ? `Assigned to ${picker}` : 'Waiting for a picker'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div>
          <p className="text-[10px] text-gray-400 uppercase">{order.items.length} items · est.</p>
          <p className="font-black text-[#185fa5]">${order.total.toFixed(2)}</p>
        </div>
        <button onClick={onView}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                     text-[#185fa5] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
          <EyeIcon className="w-4 h-4" /> Details
        </button>
      </div>
    </div>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function PendingOrdersView() {
  const queryClient = useQueryClient()
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState<'all' | 'assigned' | 'unassigned'>('all')
  const [detail,  setDetail]  = useState<Sale | null>(null)

  const { data: orders = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['PendingOrders'],
    queryFn:  getPendingOrders,
    refetchInterval: 20000,
  })

  const cancelMut = useMutation({
    mutationFn: (id: string) => updateSaleStatus({ id, status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['PendingOrders'] })
      setDetail(null); toast.success('Order cancelled')
    },
    onError: () => toast.error('Could not cancel order'),
  })

  const filtered = orders.filter(o => {
    const matchSearch = customerLabel(o.customer).toLowerCase().includes(search.toLowerCase())
    const hasPicker   = !!(o.picker && typeof o.picker === 'object')
    const matchFilter = filter === 'all' ||
      (filter === 'assigned' && hasPicker) ||
      (filter === 'unassigned' && !hasPicker)
    return matchSearch && matchFilter
  })

  const unassignedCount = orders.filter(o => !(o.picker && typeof o.picker === 'object')).length

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading pending orders...</p>
    </div>
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#1a3a5c]">Pending Orders</h1>
        <p className="text-sm text-[#5a7a9a] mt-0.5">
          {orders.length} pending · <span className="text-amber-600 font-semibold">{unassignedCount} unassigned</span>
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                       bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]" />
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {(['all', 'unassigned', 'assigned'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all
                          ${filter === f ? 'bg-white text-[#1a3a5c] shadow-sm' : 'text-gray-500'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <ClockIcon className="w-7 h-7 text-[#185fa5]/40" />
          </div>
          <p className="text-gray-400 text-sm">No pending orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => (
            <PendingCard key={order._id} order={order} onView={() => setDetail(order)} />
          ))}
        </div>
      )}

      <PendingDetailModal
        order={detail}
        onClose={() => setDetail(null)}
        onCancel={id => cancelMut.mutate(id)}
        cancelling={cancelMut.isPending}
      />
    </div>
  )
}