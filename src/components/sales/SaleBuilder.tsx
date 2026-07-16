import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }    from '@headlessui/react'
import {
  ShoppingCartIcon, MagnifyingGlassIcon,
  PlusIcon, MinusIcon, XMarkIcon,
  TagIcon, ExclamationTriangleIcon,
  ClockIcon, ArrowPathIcon,
  ArchiveBoxIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import { getProducts }          from '../../api/ProductAPI'
import { createSale }           from '../../api/SaleAPI'
import { useSavedTickets }      from '../../hooks/useSavedTickets'
import type {
  Product, Customer, CartItem, SavedTicket, PaymentMethod,
} from '../../types'
import { getCategories } from '../../api/CategoryAPI'
import type { Category } from '../../types'
import { getEffectivePrice } from '../../utils/pricing'

// ─── Constantes ────────────────────────────────────────────────────────────────
const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash',     label: 'Cash'     },
  { value: 'card',     label: 'Card'     },
  { value: 'transfer', label: 'Transfer' },
  { value: 'check',    label: 'Check'    },
  { value: 'other',    label: 'Other'    },
]

// ─── Sub-componentes (fuera del principal — evita re-render bug) ───────────────

function StockBadge({ stock }: { stock: number }) {
  if (stock > 15) return null
  if (stock <= 5)
    return (
      <span className="absolute top-1.5 left-1.5 bg-red-100 text-red-600 text-[10px]
                        font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
        <ExclamationTriangleIcon className="w-2.5 h-2.5" />
        {stock} left
      </span>
    )
  return (
    <span className="absolute top-1.5 left-1.5 bg-amber-100 text-amber-700 text-[10px]
                      font-bold px-1.5 py-0.5 rounded-full">
      {stock} left
    </span>
  )
}

function ProductCard({
  product, cartQty, displayPrice, showStock, onAdd, onSubtract,
}: {
  product:      Product
  cartQty:      number
  displayPrice: number
  showStock:    boolean
  onAdd:        () => void
  onSubtract:   () => void
}) {
  const isLow = showStock && product.stock <= 15

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden flex flex-col shadow-sm
                     transition-all
                     ${isLow ? 'border-amber-200' : 'border-gray-100'}`}>
      <div className="relative aspect-square bg-gray-50">
        {product.image ? (
          <img src={product.image} alt={product.productName}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TagIcon className="w-10 h-10 text-gray-200" />
          </div>
        )}
        {showStock && <StockBadge stock={product.stock} />}
        {cartQty > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-[#185fa5] text-white text-[10px]
                            font-bold min-w-5 h-5 rounded-full flex items-center
                            justify-center px-1 shadow">
            {cartQty}
          </span>
        )}
      </div>

      <div className="p-2.5 flex-1 flex flex-col gap-0.5">
        <p className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2 flex-1">
          {product.productName}
        </p>
        {product.category && typeof product.category === 'object' && (
          <p className="text-[10px] text-gray-400">{product.category.name}</p>
        )}
        <p className="font-bold text-[#185fa5] text-sm mt-1">
          ${displayPrice.toFixed(2)}
        </p>
      </div>

      <div className="px-2.5 pb-2.5">
        {cartQty === 0 ? (
          <button
            onClick={onAdd}
            className="w-full py-1.5 text-xs font-semibold text-white bg-[#185fa5]
                       hover:bg-[#0c447c] rounded-xl flex items-center justify-center
                       gap-1 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add
          </button>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <button onClick={onSubtract}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center
                         justify-center text-gray-600 transition-colors">
              <MinusIcon className="w-3.5 h-3.5" />
            </button>
            <span className="font-bold text-gray-800 text-sm">{cartQty}</span>
            <button onClick={onAdd}
              className="w-8 h-8 rounded-xl bg-[#185fa5] hover:bg-[#0c447c] disabled:opacity-40
                         flex items-center justify-center text-white transition-colors">
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SavedCartChip({
  ticket, onLoad, onRemove,
}: {
  ticket:   SavedTicket
  onLoad:   () => void
  onRemove: () => void
}) {
  const total = ticket.items.reduce((s, i) => s + i.total, 0)
  return (
    <div className="shrink-0 bg-white border border-amber-200 rounded-xl p-3
                    w-38.75 flex flex-col gap-2">
      <div>
        <p className="font-semibold text-gray-800 text-xs truncate">{ticket.customerName}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {ticket.items.length} items · ${total.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onLoad}
          className="flex-1 py-1 text-[10px] font-semibold text-[#185fa5]
                     bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors
                     flex items-center justify-center gap-0.5">
          <ArrowPathIcon className="w-3 h-3" /> Load
        </button>
        <button onClick={onRemove}
          className="w-7 h-6 flex items-center justify-center text-gray-400
                     hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── SaleBuilder ─────────────────────────────────────────────────────────────
// Núcleo reutilizable de "registrar una venta" — lo usan tanto el Admin (New Sale,
// con stock visible y todos los clientes) como el portal del vendedor (sin stock/
// alertas visibles y solo con sus clientes asignados).
export default function SaleBuilder({
  customers, showStock = true, seller, onSaleCreated,
}: {
  customers:      Customer[]
  showStock?:     boolean
  seller?:        { id: string; name: string }
  onSaleCreated?: () => void
}) {
  const queryClient = useQueryClient()
  const { tickets: savedTickets, saveTicket, removeTicket } = useSavedTickets()

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [cartItems,     setCartItems]     = useState<CartItem[]>([])
  const [customerId,    setCustomerId]    = useState<string>('')
  const [customerName,  setCustomerName]  = useState<string>('Walk-in Customer')
  const [notes,         setNotes]         = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cartOpen,      setCartOpen]      = useState<boolean>(false)
  const [productSearch, setProductSearch] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['Categories'],
    queryFn:  getCategories,
  })

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['Products'],
    queryFn:  getProducts,
  })

  // ── Derived ────────────────────────────────────────────────────────────────
  const cartCount = cartItems.reduce((s, i) => s + i.quantity, 0)
  const cartTotal = cartItems.reduce((s, i) => s + i.total, 0)

  const regionFee = useMemo(() => {
    if (!customerId) return 0
    const customer = customers.find(c => c._id === customerId)
    if (!customer?.region || typeof customer.region !== 'object') return 0
    return customer.region.deliveryFee ?? 0
  }, [customerId, customers])

  const getDisplayPrice = (product: Product) => getEffectivePrice(product, regionFee)

  useEffect(() => {
    setCartItems(prev => prev.map(item => {
      const newUnitPrice = parseFloat((item.basePrice + regionFee).toFixed(2))
      return {
        ...item,
        unitPrice: newUnitPrice,
        total:     parseFloat((newUnitPrice * item.quantity).toFixed(2)),
      }
    }))
  }, [regionFee])

  const visibleProducts = useMemo(() =>
    allProducts
      .filter(p =>
        !productSearch ||
        p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.category && typeof p.category === 'object' &&
         p.category.name.toLowerCase().includes(productSearch.toLowerCase()))
      )
      .filter(p =>
        activeCategory === 'all' ||
        (p.category && typeof p.category === 'object' &&
         p.category._id === activeCategory)
      )
  , [allProducts, productSearch, activeCategory])

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const getCartQty = (productId: string) =>
    cartItems.find(i => i.productId === productId)?.quantity ?? 0

 const addToCart = (product: Product) => {
  const hasPromo      = (product.promotionalPrice ?? 0) > 0
  const basePrice     = hasPromo ? product.promotionalPrice! : product.salePrice
  const adjustedPrice = getEffectivePrice(product, regionFee)

  const existing   = cartItems.find(i => i.productId === product._id)
  const currentQty = existing?.quantity ?? 0
  const newQty     = currentQty + 1

  if (showStock && product.stock > 0 && product.stock - newQty === 0)
    toast.warn('Last unit added!', { autoClose: 2000 })

  if (existing) {
    setCartItems(prev => prev.map(i =>
      i.productId === product._id
        ? { ...i, quantity: newQty, total: parseFloat((newQty * i.unitPrice).toFixed(2)) }
        : i
    ))
  } else {
    setCartItems(prev => [...prev, {
      productId:   product._id,
      productName: product.productName,
      barcode:     product.barcode,
      basePrice,                          // ← AQUÍ se usa
      unitPrice:   adjustedPrice,
      quantity:    1,
      stock:       product.stock,
      total:       adjustedPrice,
      weightPerPiece: product.weightPerPiece ?? 0
    }])
  }
}

  const subtractFromCart = (productId: string) => {
    setCartItems(prev => {
      const item = prev.find(i => i.productId === productId)
      if (!item) return prev
      if (item.quantity <= 1) return prev.filter(i => i.productId !== productId)
      const newQty = item.quantity - 1
      return prev.map(i =>
        i.productId === productId
          ? { ...i, quantity: newQty, total: parseFloat((newQty * i.unitPrice).toFixed(2)) }
          : i
      )
    })
  }

  const setQtyDirect = (productId: string, qty: number) => {
    if (qty <= 0) { setCartItems(prev => prev.filter(i => i.productId !== productId)); return }
    setCartItems(prev => prev.map(i => {
      if (i.productId !== productId) return i
      const capped = Math.min(qty, i.stock)
      return { ...i, quantity: capped, total: parseFloat((capped * i.unitPrice).toFixed(2)) }
    }))
  }

  const resetCart = () => {
    setCartItems([]); setCustomerId(''); setCustomerName('Walk-in Customer')
    setNotes(''); setPaymentMethod('cash'); setCartOpen(false)
  }

  // ── Customer select ────────────────────────────────────────────────────────
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setCustomerId(val)
    setCustomerName(!val ? 'Walk-in Customer' : customers.find(c => c._id === val)?.name ?? 'Walk-in Customer')
  }

  // ── Saved carts ────────────────────────────────────────────────────────────
  const handleSaveCart = () => {
    if (cartItems.length === 0) { toast.error('Cart is empty'); return }
    saveTicket({ customerId: customerId || null, customerName, items: cartItems, notes, paymentMethod })
    toast.success('Cart saved')
    resetCart()
  }

  const handleLoadTicket = (ticket: SavedTicket) => {
    if (cartItems.length > 0 && !window.confirm('Replace current cart with this saved cart?')) return
    setCartItems(ticket.items); setCustomerId(ticket.customerId || '')
    setCustomerName(ticket.customerName); setNotes(ticket.notes)
    setPaymentMethod(ticket.paymentMethod); removeTicket(ticket.id); setCartOpen(true)
  }

  // ── Complete sale ──────────────────────────────────────────────────────────
  const createMut = useMutation({
    mutationFn: createSale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Orders'] })
      queryClient.invalidateQueries({ queryKey: ['Products'] })
      toast.success('Sale completed!')
      resetCart()
      onSaleCreated?.()
    },
    onError: () => toast.error('Could not complete sale'),
  })

  const handleCompleteSale = () => {
    if (cartItems.length === 0) { toast.error('Cart is empty'); return }
    createMut.mutate({
      customer:      customerId || null,
      items:         cartItems.map(i => ({
        product:     i.productId,
        productName: i.productName,
        barcode:     i.barcode,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        total:       i.total,
        weightPerPiece: i.weightPerPiece ?? 0
      })),
      subtotal:      cartTotal,
      total:         cartTotal,
      paymentMethod,
      notes,
      seller:     seller?.id,
      sellerName: seller?.name,
    })
  }

  return (
    <div className="space-y-5 pb-28">

      {/* Saved carts */}
      {savedTickets.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center gap-2 mb-3">
            <ClockIcon className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-700">
              Saved Carts ({savedTickets.length})
            </p>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {savedTickets.map(ticket => (
              <SavedCartChip
                key={ticket.id}
                ticket={ticket}
                onLoad={()   => handleLoadTicket(ticket)}
                onRemove={() => removeTicket(ticket.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Customer */}
      <div>
        <label className="block text-xs font-semibold text-[#5a7a9a] uppercase
                           tracking-widest mb-1.5">
          Customer
        </label>
        <select
          value={customerId}
          onChange={handleCustomerChange}
          className="w-full px-4 py-3 text-sm border border-[#c8d8ea] rounded-xl bg-white
                     text-[#2c4a6e] focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
        >
          <option value="">Walk-in Customer</option>
          {customers.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        {/* Indicador de región activa — solo visible cuando aplica fee */}
        {regionFee > 0 && (() => {
          const customer = customers.find(c => c._id === customerId)
          const region   = customer?.region && typeof customer.region === 'object'
            ? customer.region : null
          return region ? (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50
                            rounded-xl border border-blue-100">
              <div className="w-5 h-5 rounded-lg bg-linear-to-br from-blue-500 to-sky-400
                              flex items-center justify-center shrink-0">
                <span className="text-white font-black text-[9px]">
                  {region.regionCode?.slice(0, 2)}
                </span>
              </div>
              <p className="text-xs text-[#5a7a9a]">
                Region: <span className="font-semibold text-gray-700">{region.regionName}</span>
                {' · '}
                <span className="font-semibold text-[#185fa5]">+${regionFee.toFixed(2)}</span>
                {' per product applied to prices'}
              </p>
            </div>
          ) : null
        })()}
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
        <input
          type="text"
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                     bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
        />
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[{ _id: 'all', name: 'All' }, ...categories].map(cat => (
            <button
              key={cat._id}
              onClick={() => setActiveCategory(cat._id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold
                          border transition-all whitespace-nowrap
                          ${activeCategory === cat._id
                            ? 'bg-[#185fa5] text-white border-[#185fa5] shadow-sm'
                            : 'bg-white text-[#5a7a9a] border-[#c8d8ea] hover:border-[#185fa5] hover:text-[#185fa5]'
                          }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 -mt-2">
        {visibleProducts.length} products
        {activeCategory !== 'all' && ` in ${categories.find(c => c._id === activeCategory)?.name ?? ''}`}
        {productSearch && ` · "${productSearch}"`}
      </p>

      {/* Products grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {visibleProducts.length === 0 ? (
          <div className="col-span-2 sm:col-span-3 text-center py-16 text-gray-400 text-sm">
            No products found
          </div>
        ) : visibleProducts.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            cartQty={getCartQty(product._id)}
            displayPrice={getDisplayPrice(product)}
            showStock={showStock}
            onAdd={()      => addToCart(product)}
            onSubtract={() => subtractFromCart(product._id)}
          />
        ))}
      </div>

      {/* ── Sticky cart bar (aparece cuando hay items) ────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 sm:p-5">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full max-w-lg mx-auto items-center justify-between
                       bg-[#1a3a5c] text-white px-5 py-4 rounded-2xl shadow-2xl
                       hover:bg-[#0c2a4a] active:scale-[0.99] transition-all flex"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCartIcon className="w-6 h-6" />
                <span className="absolute -top-2 -right-2.5 bg-[#185fa5] text-white text-[10px]
                                  font-bold min-w-4.5 h-4.5 rounded-full flex items-center
                                  justify-center px-1">
                  {cartCount}
                </span>
              </div>
              <span className="font-semibold text-sm">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-lg">${cartTotal.toFixed(2)}</span>
              <span className="text-xs text-white/60">View Cart →</span>
            </div>
          </button>
        </div>
      )}

      {/* ── Cart bottom sheet ─────────────────────────────────────────────── */}
      <Dialog open={cartOpen} onClose={() => setCartOpen(false)} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm
                     transition-opacity duration-200 data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex items-end justify-center">
          <DialogPanel
            transition
            className="w-full max-w-lg bg-white rounded-t-2xl shadow-2xl
                       flex flex-col max-h-[92vh]
                       transition-all duration-300 data-closed:translate-y-full"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3
                            border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="w-5 h-5 text-[#185fa5]" />
                <p className="font-bold text-[#1a3a5c] text-lg">Cart</p>
                <span className="text-xs text-[#5a7a9a] font-medium">
                  {cartCount} {cartCount === 1 ? 'item' : 'items'}
                </span>
              </div>
              <button onClick={() => setCartOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                           hover:bg-gray-100 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">

              {/* Items */}
              {cartItems.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">No items yet</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {cartItems.map(item => (
                    <div key={item.productId} className="flex items-center gap-3 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ${item.unitPrice.toFixed(2)} each
                          {showStock && item.stock <= 10 && (
                            <span className="ml-2 text-amber-500">
                              · {item.stock} in stock
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => subtractFromCart(item.productId)}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200
                                     flex items-center justify-center text-gray-600 transition-colors"
                        >
                          <MinusIcon className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={item.stock}
                          value={item.quantity}
                          onChange={e => setQtyDirect(item.productId, parseInt(e.target.value) || 0)}
                          className="w-10 text-center text-sm font-bold text-gray-800
                                     border border-gray-200 rounded-lg py-1
                                     focus:outline-none focus:ring-1 focus:ring-[#4a7fb5]"
                        />
                        <button
                          onClick={() => {
                            const newQty = item.quantity + 1
                            setCartItems(prev => prev.map(i =>
                              i.productId === item.productId
                                ? { ...i, quantity: newQty, total: parseFloat((newQty * i.unitPrice).toFixed(2)) }
                                : i
                            ))
                          }}
                          className="w-7 h-7 rounded-lg bg-[#185fa5] hover:bg-[#0c447c]
                                     disabled:opacity-40 flex items-center justify-center
                                     text-white transition-colors"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCartItems(prev => prev.filter(i => i.productId !== item.productId))}
                          className="w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50
                                     rounded-lg flex items-center justify-center transition-colors"
                        >
                          <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="font-bold text-gray-800 text-sm w-14 text-right shrink-0">
                        ${item.total.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#5a7a9a] uppercase
                                   tracking-widest mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] resize-none"
                />
              </div>

              {/* Payment */}
              <div>
                <label className="block text-xs font-semibold text-[#5a7a9a] uppercase
                                   tracking-widest mb-1.5">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl
                             bg-white focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
                >
                  {PAYMENT_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Total */}
              {cartItems.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3
                                bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-semibold text-[#1a3a5c] text-sm">Total</p>
                  <p className="font-black text-[#185fa5] text-xl">${cartTotal.toFixed(2)}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
              <button
                onClick={handleCompleteSale}
                disabled={createMut.isPending || cartItems.length === 0}
                className="w-full py-3.5 text-sm font-semibold text-white bg-emerald-600
                           hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors
                           flex items-center justify-center gap-2"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {createMut.isPending ? 'Processing...' : 'Complete Sale'}
              </button>
              <button
                onClick={handleSaveCart}
                disabled={cartItems.length === 0}
                className="w-full py-2.5 text-sm font-medium text-amber-600 bg-amber-50
                           hover:bg-amber-100 border border-amber-200 disabled:opacity-50
                           rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <ArchiveBoxIcon className="w-4 h-4" />
                Save Cart for Later
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}
