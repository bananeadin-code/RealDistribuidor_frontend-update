import { useState }                         from 'react'
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient }      from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon }       from '@heroicons/react/24/outline'
import { toast }                            from 'react-toastify'

import { createShopOrder }           from '../../api/SaleAPI'
import type { ShopOutletContextType, PaymentMethod } from '../../types'

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',     label: 'Cash'     },
  { value: 'card',     label: 'Card'     },
  { value: 'transfer', label: 'Transfer' },
  { value: 'check',    label: 'Check'    },
  { value: 'other',    label: 'Other'    },
]

const INPUT = `
  w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
  text-gray-800 placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent transition
`

export default function PlaceOrderModalClient() {
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()
  const [params, setParams] = useSearchParams()
  const isOpen = params.get('confirmOrder') === 'true'

  const { cart, cartTotal, clearCart, shopCustomer } =
    useOutletContext<ShopOutletContextType>()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [notes,         setNotes]         = useState('')

  const close = () => {
    params.delete('confirmOrder')
    setParams(params)
  }

  const orderMut = useMutation({
    mutationFn: createShopOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Products'] })
      clearCart()
      toast.success('Order placed! We\'ll be in touch soon.')
      close()
      navigate('/')
    },
    onError: () => toast.error('Could not place order. Please try again.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopCustomer || cart.length === 0) return

    orderMut.mutate({
      customer: shopCustomer._id,
      items: cart.map(i => ({
        product:     i._id,
        productName: i.productName,
        barcode:     i.barcode,
        quantity:    i.quantity,
        unitPrice:   i.displayPrice,
        total:       parseFloat((i.displayPrice * i.quantity).toFixed(2)),
        weightPerPiece: i.weightPerPiece ?? 0
      })),
      subtotal:      cartTotal,
      total:         cartTotal,
      paymentMethod,
      notes,
    })
  }

  return (
    <Dialog open={isOpen} onClose={close} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl
                     shadow-2xl flex flex-col max-h-[92vh]
                     transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:data-closed:scale-95 sm:data-closed:opacity-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-gray-100 shrink-0">
            <p className="font-bold text-[#1a3a5c] text-lg">Confirm Order</p>
            <button onClick={close}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form id="shop-order-form" onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-4">

            {/* Customer info — pre-filled, read-only */}
            {shopCustomer && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-[#5a7a9a] uppercase tracking-widest">
                  Order for
                </p>
                <p className="font-bold text-gray-800">{shopCustomer.name}</p>
                {shopCustomer.phone && (
                  <p className="text-sm text-gray-500">{shopCustomer.phone}</p>
                )}
                {shopCustomer.address && (
                  <p className="text-sm text-gray-500">{shopCustomer.address}</p>
                )}
              </div>
            )}

            {/* Order summary */}
            <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100
                            flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5a7a9a]">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </p>
                <p className="font-black text-[#185fa5] text-xl">${cartTotal.toFixed(2)}</p>
              </div>
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className={INPUT}>
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special instructions, delivery notes..."
                rows={3}
                className={`${INPUT} resize-none`}
              />
            </div>
          </form>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
            <button type="submit" form="shop-order-form"
              disabled={orderMut.isPending || cart.length === 0}
              className="w-full py-3.5 text-sm font-semibold text-white bg-emerald-600
                         hover:bg-emerald-700 disabled:opacity-60 rounded-xl transition-colors
                         flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-5 h-5" />
              {orderMut.isPending ? 'Placing order...' : 'Place Order'}
            </button>
            <button type="button" onClick={close}
              className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100
                         hover:bg-gray-200 rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}