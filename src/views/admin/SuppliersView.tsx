import { useState, useRef, useEffect } from 'react'
import { useNavigate }                  from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }   from '@headlessui/react'
import {
  MagnifyingGlassIcon, PlusIcon, TruckIcon,
  PencilSquareIcon, TrashIcon, XMarkIcon,
  PhoneIcon, MapPinIcon, EnvelopeIcon,
  UserIcon, CreditCardIcon, DocumentTextIcon,
  ChevronDownIcon, DocumentPlusIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import { getSuppliers, deleteSupplier }   from '../../api/SupplierAPI'
import { getProducts }                    from '../../api/ProductAPI'
import { createPurchaseOrder }            from '../../api/PurchaseOrderAPI'
import type { Supplier, Product, POItem } from '../../types'

// ─── SupplierCard ──────────────────────────────────────────────────────────────
function SupplierCard({
  supplier,
  onEdit,
  onDelete,
  onCreatePO,
}: {
  supplier:   Supplier
  onEdit:     () => void
  onDelete:   () => void
  onCreatePO: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const hasExtra =
    !!(supplier.email || supplier.contactPerson || supplier.paymentTerms || supplier.notes)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 flex-1">

        {/* Name + action buttons */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-bold text-[#1a3a5c] text-base uppercase leading-snug wrap-break-word">
            {supplier.name}
          </h3>
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={onEdit} title="Edit"
              className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50 rounded-lg transition-colors">
              <PencilSquareIcon className="w-4 h-4" />
            </button>
            <button onClick={onDelete} title="Delete"
              className="p-1.5 text-[#5a7a9a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Datos visibles siempre */}
        <div className="space-y-1.5">
          {supplier.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {(supplier.address || supplier.city) && (
            <div className="flex items-start gap-2 text-sm text-gray-500">
              <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="wrap-break-word">
                {[supplier.address, supplier.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Datos expandibles */}
        {hasExtra && (
          <>
            {expanded && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                {supplier.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <EnvelopeIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="break-all">{supplier.email}</span>
                  </div>
                )}
                {supplier.contactPerson && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{supplier.contactPerson}</span>
                  </div>
                )}
                {supplier.paymentTerms && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCardIcon className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{supplier.paymentTerms}</span>
                  </div>
                )}
                {supplier.notes && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <DocumentTextIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{supplier.notes}</span>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setExpanded(e => !e)}
              className="mt-2.5 text-xs text-[#5a7a9a] hover:text-[#185fa5]
                         font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronDownIcon
                className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              />
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </>
        )}
      </div>

      {/* Create PO button — siempre al fondo de la card */}
      <button
        onClick={onCreatePO}
        className="w-full py-3 text-sm font-semibold text-[#185fa5]
                   bg-blue-50 hover:bg-blue-100 border-t border-blue-100
                   transition-colors flex items-center justify-center gap-1.5"
      >
        <DocumentPlusIcon className="w-4 h-4" />
        Create Purchase Order
      </button>
    </div>
  )
}

// ─── CreatePOModal ─────────────────────────────────────────────────────────────
function CreatePOModal({
  open,
  supplier,
  onClose,
}: {
  open:     boolean
  supplier: Supplier | null
  onClose:  () => void
}) {
  const queryClient = useQueryClient()

  // Estado del formulario
  const [productSearch,   setProductSearch]   = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [quantity,        setQuantity]        = useState(1)
  const [unitPrice,       setUnitPrice]       = useState(0)
  const [items,           setItems]           = useState<POItem[]>([])
  const [deliveryDate,    setDeliveryDate]    = useState('')
  const [notes,           setNotes]           = useState('')
  const [totalWeight, setTotalWeight] = useState(0)

  const searchRef = useRef<HTMLDivElement>(null)

  // Cierra suggestions al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['Products'],
    queryFn:  getProducts,
  })

  const suggestions = productSearch.length > 1
    ? products
        .filter(p => p.productName.toLowerCase().includes(productSearch.toLowerCase()))
        .slice(0, 6)
    : []

  const computedTotal = items.reduce((s, i) => s + i.total, 0)
  // Auto-calculado desde los items, pero editable — el flete real varía por
  // proveedor y no se puede derivar de forma estática por producto.
  const [total, setTotal] = useState(0)
  useEffect(() => { setTotal(computedTotal) }, [items])

  const createMut = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['PurchaseOrders'] })
      toast.success('Purchase order created')
      handleClose()
    },
    onError: () => toast.error('Could not create purchase order'),
  })

  const handleClose = () => {
    setProductSearch(''); setSelectedProduct(null); setShowSuggestions(false)
    setQuantity(1); setUnitPrice(0); setItems([]); setDeliveryDate(''); setNotes('')
    setTotalWeight(0)
    onClose()
  }

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p)
    setProductSearch(p.productName)
    setUnitPrice(p.cost ?? 0)
    setShowSuggestions(false)
  }

  const handleAddItem = () => {
    if (!selectedProduct || quantity <= 0) return

    const weightPerPiece = selectedProduct.weightPerPiece ?? 0
    const itemWeight     = parseFloat((quantity * weightPerPiece).toFixed(4))

    setItems(prev => {
      const idx = prev.findIndex(i => i.product === selectedProduct._id)
      let next: POItem[]

      if (idx >= 0) {
        next = prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                quantity:   item.quantity + quantity,
                total:      (item.quantity + quantity) * item.unitPrice,
                itemWeight: parseFloat(((item.quantity + quantity) * weightPerPiece).toFixed(4)),
              }
            : item
        )
      } else {
        next = [...prev, {
          product:        selectedProduct._id,
          productName:    selectedProduct.productName,
          quantity,
          unitPrice,
          total:          quantity * unitPrice,
          weightPerPiece,
          itemWeight,
        }]
      }

      // Recalcula totalWeight
      setTotalWeight(
        parseFloat(next.reduce((s, i) => s + (i.itemWeight ?? 0), 0).toFixed(4))
      )
      return next
    })

    setSelectedProduct(null); setProductSearch(''); setQuantity(1); setUnitPrice(0)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplier || items.length === 0 || !deliveryDate) return
    createMut.mutate({
      supplier:             supplier._id,
      items,
      expectedDeliveryDate: deliveryDate,
      notes,
      total,
      totalWeight,
    })
  }

  return (
    <Dialog open={open && !!supplier} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl
                     flex flex-col max-h-[92vh]
                     transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:data-closed:scale-95 sm:data-closed:opacity-0"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            <div>
              <p className="font-bold text-[#1a3a5c] text-base">Create Purchase Order</p>
              <p className="text-xs font-semibold text-[#5a7a9a] uppercase tracking-widest mt-0.5">
                {supplier?.name}
              </p>
            </div>
            <button onClick={handleClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable form body */}
          <form
            id="po-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto min-h-0"
          >
            <div className="p-5 space-y-5">

              {/* Sección: Add Items */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-semibold text-[#1a3a5c] text-sm mb-3">Add Items</p>

                {/* Buscador de producto */}
                <div ref={searchRef} className="relative mb-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => {
                      setProductSearch(e.target.value)
                      setSelectedProduct(null)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search product name..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                               focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
                  />
                  {/* Dropdown de sugerencias */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200
                                    rounded-xl shadow-lg overflow-hidden">
                      {suggestions.map(p => (
                        <button
                          key={p._id}
                          type="button"
                          onMouseDown={() => handleSelectProduct(p)}
                          className="w-full flex items-center justify-between px-3 py-2.5
                                     text-sm hover:bg-blue-50 transition-colors"
                        >
                          <span className="font-medium text-gray-800 text-left truncate pr-3">
                            {p.productName}
                          </span>
                          <span className="text-xs text-gray-400 shrink-0">
                            Unit cost: ${(p.cost ?? 0).toFixed(2)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Qty + Unit Price + Add */}
                <div className="flex items-end gap-2">
                  <div className="w-24 shrink-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                    <input
                      type="number" min={1} value={quantity}
                      onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Cost</label>
                    <input
                      type="number" min={0} step="0.01" value={unitPrice}
                      onChange={e => setUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                                 focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selectedProduct || quantity <= 0}
                    className="px-4 py-2 text-sm font-semibold text-white bg-[#185fa5]
                               hover:bg-[#0c447c] disabled:opacity-40 rounded-xl transition-colors
                               flex items-center gap-1 shrink-0"
                  >
                    <PlusIcon className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              {/* Order Items list */}
              {items.length > 0 && (
                <div>
                  <p className="font-semibold text-[#1a3a5c] text-sm mb-2">Order Items</p>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx}
                        className="flex items-center justify-between bg-white border border-gray-100
                                   rounded-xl px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-800 text-sm uppercase truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.quantity} × ${item.unitPrice.toFixed(2)} = ${item.total.toFixed(2)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 ml-3 text-red-400 hover:text-red-600 hover:bg-red-50
                                     rounded-lg transition-colors shrink-0"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Total — auto-calculado, pero editable (el flete varía por proveedor) */}
                    <div className="flex items-center justify-between px-4 py-3
                                    bg-blue-50 rounded-xl border border-blue-100">
                      <div>
                        <p className="font-semibold text-[#1a3a5c] text-sm">Total</p>
                        <p className="text-[11px] text-[#5a7a9a]">Editable — add freight if needed</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-black text-[#185fa5] text-lg">$</span>
                        <input
                          type="number" min={0} step="0.01" value={total}
                          onChange={e => setTotal(parseFloat(e.target.value) || 0)}
                          className="w-28 text-right font-black text-[#185fa5] text-lg bg-white
                                     border border-blue-200 rounded-lg px-2 py-1
                                     focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2.5
                    bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-sm text-[#5a7a9a] font-medium">Est. Total Weight</p>
                      <p className="font-bold text-gray-700 text-sm">
                        {totalWeight > 0 ? `${totalWeight} lbs` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Expected Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
                             focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent
                             resize-none"
                />
              </div>

            </div>
          </form>

          {/* Footer — fuera del scroll, siempre visible */}
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={handleClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-white
                         border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              form="po-form"
              disabled={createMut.isPending || items.length === 0 || !deliveryDate}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#185fa5]
                         hover:bg-[#0c447c] disabled:opacity-50 rounded-xl transition-colors"
            >
              {createMut.isPending ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function SuppliersView() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [search,           setSearch]           = useState('')
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null)
  const [poSupplier,       setPoSupplier]       = useState<Supplier | null>(null)

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ['Suppliers'],
    queryFn:  getSuppliers,
  })

  const deleteMut = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Suppliers'] })
      setDeletingSupplier(null)
      toast.success('Supplier deleted')
    },
    onError: () => toast.error('Could not delete supplier'),
  })

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading suppliers...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1a3a5c]">Suppliers</h1>
        <p className="text-sm text-[#5a7a9a] mt-0.5">Manage suppliers and create purchase orders</p>
      </div>

      {/* Buscador + New Supplier */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                       bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
          />
        </div>
        <button
          onClick={() => navigate('/admin-view-privated/suppliers/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                     text-white bg-[#185fa5] hover:bg-[#0c447c] rounded-xl transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">New Supplier</span>
        </button>
      </div>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <TruckIcon className="w-7 h-7 text-[#185fa5]/40" />
          </div>
          <p className="text-gray-400 text-sm">
            {search ? 'No suppliers match your search' : 'No suppliers registered yet'}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/admin-view-privated/suppliers/new')}
              className="mt-3 text-sm text-[#185fa5] font-semibold hover:underline"
            >
              Add your first supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(supplier => (
            <SupplierCard
              key={supplier._id}
              supplier={supplier}
              onEdit={()     => navigate(`/admin-view-privated/suppliers/${supplier._id}/edit`)}
              onDelete={()   => setDeletingSupplier(supplier)}
              onCreatePO={() => setPoSupplier(supplier)}
            />
          ))}
        </div>
      )}

      {/* Modal Create PO */}
      <CreatePOModal
        open={!!poSupplier}
        supplier={poSupplier}
        onClose={() => setPoSupplier(null)}
      />

      {/* Confirmar borrado */}
      <Dialog open={!!deletingSupplier} onClose={() => setDeletingSupplier(null)} className="relative z-50">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm
                     transition-opacity duration-200 data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6
                       transition-all duration-200 data-closed:scale-95 data-closed:opacity-0"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <TrashIcon className="w-5 h-5 text-red-500" />
              </div>
              <p className="font-bold text-[#1a3a5c] text-lg">Delete Supplier</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-700">{deletingSupplier?.name}</span>?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingSupplier(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                           hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deletingSupplier!._id)}
                disabled={deleteMut.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500
                           hover:bg-red-600 disabled:opacity-50 rounded-xl transition-colors"
              >
                {deleteMut.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

    </div>
  )
}