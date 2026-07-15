import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import {
  MagnifyingGlassIcon, PlusIcon, TagIcon,
  EyeIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { toast } from 'react-toastify'

import { getProducts, deleteProduct }                    from '../../api/ProductAPI'
import { getCategories, createCategory, deleteCategory } from '../../api/CategoryAPI'
import type { Category, Product }                        from '../../types'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (n?: number) => (n != null ? `$${n.toFixed(2)}` : '—')

// ─── ProductCard (solo en móvil) ───────────────────────────────────────────────
function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
}: {
  product:  Product
  onView:   () => void
  onEdit:   () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3">

        {/* Imagen */}
        {product.image ? (
          <img
            src={product.image}
            alt={product.productName}
            className="w-14 h-14 object-contain rounded-xl border border-gray-100 bg-gray-50 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <TagIcon className="w-6 h-6 text-[#185fa5]/30" />
          </div>
        )}

        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm leading-snug truncate">
            {product.productName}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {product.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium
                               bg-blue-50 text-blue-600 border border-blue-100">
                {product.category.name}
              </span>
            )}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium
                             bg-gray-100 text-gray-500 border border-gray-200 uppercase">
              {product.unitOfMeasure}
            </span>
          </div>
        </div>
      </div>

      {/* Precio + Stock */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Price</p>
          <p className="font-bold text-[#185fa5] text-base">{fmt$(product.salePrice)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Stock</p>
          <span className="inline-flex items-center gap-1 font-bold text-gray-700 text-base">
            {product.stock}
            {product.stock < 30 && (
              <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
            )}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
        <button
          onClick={onView}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs
                     font-medium text-[#5a7a9a] bg-gray-50 hover:bg-blue-50
                     hover:text-[#185fa5] rounded-xl border border-gray-200 transition-colors"
        >
          <EyeIcon className="w-3.5 h-3.5" /> Details
        </button>
        <button
          onClick={onEdit}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs
                     font-semibold text-white bg-[#185fa5] hover:bg-[#0c447c]
                     rounded-xl transition-colors"
        >
          <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={onDelete}
          className="p-2 text-[#5a7a9a] hover:text-red-500 hover:bg-red-50
                     rounded-xl border border-gray-200 transition-colors"
          title="Delete"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── ProductDetailDialog ───────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-[#5a7a9a] uppercase tracking-widest mb-2">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">{children}</div>
    </div>
  )
}
function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-medium text-gray-800 mt-0.5">{value ?? '—'}</p>
    </div>
  )
}

const supplierName = (s: Product['supplier']) =>
  s && typeof s === 'object' ? s.name : '—'

function ProductDetailDialog({
  product, onClose, onEdit,
}: {
  product: Product | null
  onClose: () => void
  onEdit:  (id: string) => void
}) {
  return (
    <Dialog open={!!product} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden
                     transition-all duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          {product && (
            <>
              <div className="flex items-start gap-4 p-5 bg-gray-50 border-b border-gray-100">
                {product.image ? (
                  <img src={product.image} alt={product.productName}
                    className="w-16 h-16 object-contain rounded-xl border border-gray-200 bg-white shrink-0" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <TagIcon className="w-7 h-7 text-[#185fa5]/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#1a3a5c] text-base leading-tight">
                    {product.productName}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {product.category && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full
                                       bg-blue-50 text-blue-600 border border-blue-200 font-medium">
                        {product.category.name}
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded-full
                                     bg-gray-100 text-gray-500 border border-gray-200 uppercase font-medium">
                      {product.unitOfMeasure}
                    </span>
                  </div>
                </div>
                <button onClick={onClose}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto space-y-5">
                <Section title="General Info">
                  <Field label="Barcode" value={product.barcode} />
                  <Field label="Expiration"
                    value={product.expirationDate
                      ? new Date(product.expirationDate).toLocaleDateString('en-US')
                      : undefined}
                  />
                  <Field label="Stock"    value={product.stock} />
                  <Field label="Supplier"
                    value={supplierName(product.supplier)}
                  />
                </Section>
                <div className="border-t border-gray-100 pt-5">
                  <Section title="Prices">
                    <Field label="Sale Price"        value={fmt$(product.salePrice)} />
                    <Field label="Promotional"       value={fmt$(product.promotionalPrice)} />
                    <Field label="Price / Piece"     value={fmt$(product.pricePerPiece)} />
                    <Field label="Promo / Piece"     value={fmt$(product.promotionalPricePerPiece)} />
                    <Field label="Cost"              value={fmt$(product.cost)} />
                  </Section>
                </div>
                <div className="border-t border-gray-100 pt-5">
                  <Section title="Pallet Logistics">
                    <Field label="Pieces / Box"    value={product.piecesPerBox} />
                    <Field label="Units / Pallet"  value={product.unitsPerPallet} />
                    <Field label="Boxes / Layer"   value={product.boxesPerLayer} />
                    <Field label="Layers / Pallet" value={product.layersPerPallet} />
                  </Section>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-3">
                <button onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                             hover:bg-gray-200 rounded-xl transition-colors">
                  Close
                </button>
                <button onClick={() => onEdit(product._id)}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#185fa5]
                             hover:bg-[#0c447c] rounded-xl transition-colors
                             flex items-center gap-1.5">
                  <PencilSquareIcon className="w-4 h-4" /> Edit Product
                </button>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── CategoryDialog ────────────────────────────────────────────────────────────
function CategoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['Categories'],
    queryFn:  getCategories,
    enabled:  open,
  })

  const createMut = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Categories'] })
      setName('')
      toast.success('Category created')
    },
    onError: () => toast.error('Could not create category'),
  })

  const deleteMut = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Categories'] })
      toast.success('Category deleted')
    },
    onError: () => toast.error('Could not delete category'),
  })

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden
                     transition-all duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="font-bold text-[#1a3a5c] text-lg">Manage Categories</p>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-[#5a7a9a] uppercase tracking-widest mb-2">
              New Category
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && name.trim() && createMut.mutate(name.trim())}
                placeholder="Category name..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
              />
              <button
                onClick={() => name.trim() && createMut.mutate(name.trim())}
                disabled={createMut.isPending || !name.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#185fa5]
                           hover:bg-[#0c447c] disabled:opacity-50 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <p className="text-center text-sm text-gray-400 py-8 animate-pulse">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">No categories yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {categories.map(cat => (
                  <li key={cat._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    <button
                      onClick={() => deleteMut.mutate(cat._id)}
                      disabled={deleteMut.isPending}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50
                                 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                         hover:bg-gray-200 rounded-xl transition-colors">
              Done
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function AdminProductsView() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [search,          setSearch]          = useState('')
  const [detailProduct,   setDetailProduct]   = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [showCategories,  setShowCategories]  = useState(false)

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['Products'],
    queryFn:  getProducts,
  })

  const deleteMut = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Products'] })
      setDeletingProduct(null)
      toast.success('Product deleted')
    },
    onError: () => toast.error('Could not delete product'),
  })

  const filtered = products.filter(p =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading products...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#1a3a5c]">Products</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCategories(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium
                       text-[#185fa5] bg-blue-50 hover:bg-blue-100
                       border border-blue-200 rounded-xl transition-colors"
          >
            <TagIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Categories</span>
          </button>
          <button
            onClick={() => navigate('/admin-view-privated/products/new')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold
                       text-white bg-[#185fa5] hover:bg-[#0c447c] rounded-xl transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                     bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
        />
      </div>

      {/* ── MOBILE: Cards (< sm) ─────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-14 text-gray-400 text-sm">
            No products found
          </div>
        ) : filtered.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            onView={()   => setDetailProduct(product)}
            onEdit={()   => navigate(`/admin-view-privated/products/${product._id}/edit`)}
            onDelete={()  => setDeletingProduct(product)}
          />
        ))}
      </div>

      {/* ── DESKTOP: Tabla (≥ sm) ────────────────────────────────────── */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-125">
            <thead>
              <tr className="bg-[#1a3a5c] text-white text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-semibold">Image</th>
                <th className="px-4 py-3 text-left font-semibold">Product</th>
                <th className="px-4 py-3 text-left font-semibold">Category</th>
                <th className="px-4 py-3 text-right font-semibold">Price</th>
                <th className="px-4 py-3 text-center font-semibold">Stock</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-14 text-gray-400 text-sm">
                    No products found
                  </td>
                </tr>
              ) : filtered.map(product => (
                <tr key={product._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    {product.image ? (
                      <img src={product.image} alt={product.productName}
                        className="w-10 h-10 object-contain rounded-lg border border-gray-100" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <TagIcon className="w-5 h-5 text-[#185fa5]/30" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-800 leading-snug">{product.productName}</p>
                    <p className="text-xs text-gray-400 uppercase mt-0.5">{product.unitOfMeasure}</p>
                  </td>
                  <td className="px-4 py-3">
                    {product.category ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium
                                       bg-blue-50 text-blue-600 border border-blue-100">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#185fa5]">
                    {fmt$(product.salePrice)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
                      {product.stock}
                      {product.stock < 30 && (
                        <ExclamationCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setDetailProduct(product)} title="View details"
                        className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50
                                   rounded-lg transition-colors">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/admin-view-privated/products/${product._id}/edit`)}
                        title="Edit"
                        className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50
                                   rounded-lg transition-colors">
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeletingProduct(product)} title="Delete"
                        className="p-1.5 text-[#5a7a9a] hover:text-red-500 hover:bg-red-50
                                   rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalles */}
      <ProductDetailDialog
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onEdit={id => { setDetailProduct(null); navigate(`/admin-view-privated/products/${id}/edit`) }}
      />

      {/* Categorías */}
      <CategoryDialog open={showCategories} onClose={() => setShowCategories(false)} />

      {/* Confirmar borrado */}
      <Dialog open={!!deletingProduct} onClose={() => setDeletingProduct(null)} className="relative z-50">
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
              <p className="font-bold text-[#1a3a5c] text-lg">Delete Product</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-700">{deletingProduct?.productName}</span>?
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                           hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deletingProduct!._id)}
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