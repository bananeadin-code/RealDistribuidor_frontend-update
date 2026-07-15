import { useState }                              from 'react'
import { useQuery, useMutation, useQueryClient }  from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }    from '@headlessui/react'
import {
  ClipboardDocumentListIcon, InboxArrowDownIcon,
  CheckCircleIcon, XMarkIcon, HandRaisedIcon,
  ArrowUturnLeftIcon, 
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import {
  getAvailableOrders, getMyOrders,
  claimOrder, releaseOrder,
} from '../../api/PickerAPI'
import { fulfillOrder }          from '../../api/SaleAPI'
import type { Sale, PickerSession, Product } from '../../types'
import { getProducts } from '../../api/ProductAPI'

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'

const shortId       = (id: string) => id.slice(-6).toUpperCase()
const customerLabel = (c: Sale['customer']) =>
  c && typeof c === 'object' ? c.name : 'Walk-in'

// ─── Fulfill modal ─────────────────────────────────────────────────────────────
function FulfillModal({
  order, picker, onClose,
}: {
  order:   Sale | null
  picker:  PickerSession
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [picked, setPicked] = useState<Record<string, number>>({})

  // Trae los productos para conocer el stock real actual
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['Products'],
    queryFn:  getProducts,
    enabled:  !!order,
  })

  const getStock = (productId: string) =>
    products.find(p => p._id === productId)?.stock ?? 0

  const init = () => {
    if (!order) return
    const map: Record<string, number> = {}
    order.items.forEach(i => {
      const stock = getStock(i.product)
      // Default: lo que pide la orden, PERO capado al stock disponible
      map[i.product] = Math.max(0, Math.min(i.quantity, stock))
    })
    setPicked(map)
  }

  const fulfillMut = useMutation({
    mutationFn: fulfillOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picker-my-orders'] })
      queryClient.invalidateQueries({ queryKey: ['picker-available'] })
      queryClient.invalidateQueries({ queryKey: ['Products'] })
      toast.success('Order fulfilled — ticket generated')
      onClose()
    },
    onError: () => toast.error('Could not fulfill order'),
  })

  const handleSubmit = () => {
    if (!order) return
    fulfillMut.mutate({
      id:    order._id,
      items: order.items.map(i => ({
        product:        i.product,
        pickedQuantity: picked[i.product] ?? 0,
      })),
      pickerId:   picker._id,
      pickerName: picker.name,
    })
  }

  return (
    <Dialog open={!!order} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0" />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel transition
          ref={() => { if (order && products.length > 0 && Object.keys(picked).length === 0) init() }}
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl
                     flex flex-col max-h-[92vh] transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:data-closed:scale-95 sm:data-closed:opacity-0">
          {order && (
            <>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                  <p className="font-black text-[#1a3a5c] text-lg">Fulfill Order</p>
                  <p className="text-xs text-[#5a7a9a]">
                    #{shortId(order._id)} · {customerLabel(order.customer)}
                  </p>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
                <p className="text-xs text-gray-400">
                  Confirm the quantity picked for each product. The checkmark appears
                  when the full requested amount is available and picked.
                </p>

                {order.items.map(item => {
                  const requested = item.quantity
                  const stock     = getStock(item.product)
                  const current   = picked[item.product] ?? 0
                  const canFulfillFull = stock >= requested
                  const isComplete = current === requested && canFulfillFull
                  const noStock    = stock <= 0
                  const maxPickable = Math.max(0, stock)   // no puede surtir más de lo que hay

                  return (
                    <div key={item.product}
                      className={`rounded-xl p-3 border
                        ${noStock ? 'bg-red-50 border-red-200'
                          : isComplete ? 'bg-emerald-50 border-emerald-100'
                          : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-gray-800 text-sm flex-1">
                          {item.productName}
                        </p>
                        {isComplete && (
                          <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                        )}
                        {noStock && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-100
                                           px-2 py-0.5 rounded-full shrink-0">
                            OUT OF STOCK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-gray-500">
                            Requested: <span className="font-bold text-gray-700">{requested}</span>
                          </span>
                          <span className={`ml-3 ${stock < requested ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            In stock: {stock}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Picked:</label>
                          <input
                            type="number"
                            min={0}
                            max={maxPickable}
                            disabled={noStock}
                            value={current}
                            onChange={e => {
                              // No permite más de lo que hay en stock
                              const val = Math.max(0, Math.min(maxPickable, parseInt(e.target.value) || 0))
                              setPicked(prev => ({ ...prev, [item.product]: val }))
                            }}
                            className={`w-16 text-center text-sm font-bold rounded-lg py-1.5 border
                                        focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        ${isComplete ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                          : current === 0 ? 'border-red-200 bg-red-50 text-red-600'
                                          : 'border-amber-200 bg-amber-50 text-amber-700'}`}
                          />
                        </div>
                      </div>
                      {stock < requested && stock > 0 && (
                        <p className="text-[10px] text-amber-600 mt-1.5">
                          Only {stock} available — cannot fulfill the full requested amount
                        </p>
                      )}
                    </div>
                  )
                })}

              </div>

              <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                <button onClick={handleSubmit} disabled={fulfillMut.isPending}
                  className="w-full py-3.5 text-sm font-semibold text-white bg-emerald-600
                             hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors
                             flex items-center justify-center gap-2">
                  <CheckCircleIcon className="w-5 h-5" />
                  {fulfillMut.isPending ? 'Processing...' : 'Mark as Completed & Generate Ticket'}
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
function OrderCard({
  order, mine, onClaim, onRelease, onFulfill,
}: {
  order:     Sale
  mine:      boolean
  onClaim?:  () => void
  onRelease?: () => void
  onFulfill?: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs text-gray-400 font-mono">#{shortId(order._id)}</p>
            <p className="font-bold text-[#1a3a5c] text-sm mt-0.5">
              {customerLabel(order.customer)}
            </p>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600
                           border border-amber-200 font-semibold">
            {order.items.length} items
          </span>
        </div>
        <p className="text-xs text-gray-400">{fmtDate(order.createdAt)}</p>

        {/* Lista resumida de productos */}
        <div className="mt-2 pt-2 border-t border-gray-50 space-y-1">
          {order.items.slice(0, 3).map(i => (
            <div key={i.product} className="flex items-center justify-between text-xs">
              <span className="text-gray-600 truncate flex-1">{i.productName}</span>
              <span className="font-semibold text-gray-700 shrink-0 ml-2">×{i.quantity}</span>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-[10px] text-gray-400">+{order.items.length - 3} more</p>
          )}
        </div>
      </div>

      <div className="flex border-t border-gray-100">
        {mine ? (
          <>
            <button onClick={onRelease}
              className="flex-1 py-3 text-xs font-semibold text-gray-500 hover:bg-gray-50
                         transition-colors flex items-center justify-center gap-1.5">
              <ArrowUturnLeftIcon className="w-4 h-4" /> Release
            </button>
            <button onClick={onFulfill}
              className="flex-1 py-3 text-xs font-semibold text-white bg-emerald-600
                         hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5">
              <CheckCircleIcon className="w-4 h-4" /> Fulfill
            </button>
          </>
        ) : (
          <button onClick={onClaim}
            className="flex-1 py-3 text-xs font-semibold text-white bg-[#185fa5]
                       hover:bg-[#0c447c] transition-colors flex items-center justify-center gap-1.5">
            <HandRaisedIcon className="w-4 h-4" /> Take Order
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function PickerDashboardView({ picker }: { picker: PickerSession }) {
  const queryClient = useQueryClient()
  const [tab,        setTab]        = useState<'mine' | 'available'>('mine')
  const [fulfilling, setFulfilling] = useState<Sale | null>(null)

  const { data: available = [] } = useQuery<Sale[]>({
    queryKey: ['picker-available'],
    queryFn:  getAvailableOrders,
    refetchInterval: 15000,   // refresca cada 15s para ver nuevas
  })
  const { data: mine = [] } = useQuery<Sale[]>({
    queryKey: ['picker-my-orders', picker._id],
    queryFn:  () => getMyOrders(picker._id),
    refetchInterval: 15000,
  })

  const claimMut = useMutation({
    mutationFn: claimOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picker-available'] })
      queryClient.invalidateQueries({ queryKey: ['picker-my-orders'] })
      toast.success('Order assigned to you')
      setTab('mine')
    },
    onError: () => toast.error('Order was already taken'),
  })

  const releaseMut = useMutation({
    mutationFn: releaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['picker-available'] })
      queryClient.invalidateQueries({ queryKey: ['picker-my-orders'] })
      toast.info('Order released back to pool')
    },
    onError: () => toast.error('Could not release order'),
  })

  const list = tab === 'mine' ? mine : available

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#1a3a5c]">My Work</h1>
        <p className="text-sm text-[#5a7a9a] mt-0.5">Hello {picker.name}, here are your orders</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setTab('mine')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
                      flex items-center justify-center gap-1.5
                      ${tab === 'mine' ? 'bg-white text-[#1a3a5c] shadow-sm' : 'text-gray-500'}`}>
          <ClipboardDocumentListIcon className="w-4 h-4" />
          My Orders ({mine.length})
        </button>
        <button onClick={() => setTab('available')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all
                      flex items-center justify-center gap-1.5
                      ${tab === 'available' ? 'bg-white text-[#1a3a5c] shadow-sm' : 'text-gray-500'}`}>
          <InboxArrowDownIcon className="w-4 h-4" />
          Available ({available.length})
        </button>
      </div>

      {/* Grid */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <InboxArrowDownIcon className="w-7 h-7 text-[#185fa5]/40" />
          </div>
          <p className="text-gray-400 text-sm">
            {tab === 'mine' ? 'You have no orders assigned' : 'No orders available right now'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(order => (
            <OrderCard
              key={order._id}
              order={order}
              mine={tab === 'mine'}
              onClaim={()   => claimMut.mutate({ orderId: order._id, pickerId: picker._id, pickerName: picker.name })}
              onRelease={() => releaseMut.mutate(order._id)}
              onFulfill={() => setFulfilling(order)}
            />
          ))}
        </div>
      )}

      <FulfillModal
        key={fulfilling?._id ?? 'none'}
        order={fulfilling}
        picker={picker}
        onClose={() => setFulfilling(null)}
      />
    </div>
  )
}