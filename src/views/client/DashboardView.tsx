import { useState, useMemo }              from 'react'
import { useQuery }                        from '@tanstack/react-query'
import { useOutletContext }                 from 'react-router-dom'
import { MagnifyingGlassIcon, PlusIcon, MinusIcon, TagIcon } from '@heroicons/react/24/outline'

import { getProducts }   from '../../api/ProductAPI'
import { getCategories } from '../../api/CategoryAPI'
import type { Product, Category, ShopOutletContextType } from '../../types'
import { getEffectivePrice } from '../../utils/pricing'

function CategoryPill({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap
        ${active
          ? 'bg-[#185fa5] text-white border-[#185fa5] shadow-sm'
          : 'bg-white text-[#5a7a9a] border-[#c8d8ea] hover:border-[#185fa5] hover:text-[#185fa5]'}`}>
      {label}
    </button>
  )
}

function ProductCard({ product, cartQty, displayPrice, onAdd, onSubtract }: {
  product: Product; cartQty: number; displayPrice: number
  onAdd: () => void; onSubtract: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col
                    overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-50 relative overflow-hidden">
        {product.image
          ? <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center">
              <TagIcon className="w-10 h-10 text-gray-200" />
            </div>
        }
        {cartQty > 0 && (
          <span className="absolute top-2 right-2 bg-[#185fa5] text-white text-[10px] font-bold
                           min-w-5 h-5 rounded-full flex items-center justify-center px-1 shadow">
            {cartQty}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="font-semibold text-gray-800 text-xs leading-snug line-clamp-2 flex-1">
          {product.productName}
        </p>
        {product.category && typeof product.category === 'object' && (
          <p className="text-[10px] text-gray-400">{product.category.name}</p>
        )}
        <p className="font-bold text-[#185fa5] text-sm mt-1">
          ${displayPrice.toFixed(2)}
          <span className="text-gray-400 text-[10px] font-normal ml-1">/ piece</span>
        </p>
      </div>
      <div className="px-3 pb-3">
        {cartQty === 0
          ? <button onClick={onAdd}
              className="w-full py-2 text-xs font-semibold text-white bg-[#185fa5]
                         hover:bg-[#0c447c] rounded-xl flex items-center justify-center gap-1 transition-colors">
              <PlusIcon className="w-3.5 h-3.5" /> Add to cart
            </button>
          : <div className="flex items-center justify-between gap-1">
              <button onClick={onSubtract}
                className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors">
                <MinusIcon className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold text-gray-800 text-sm">{cartQty}</span>
              <button onClick={onAdd}
                className="w-8 h-8 rounded-xl bg-[#185fa5] hover:bg-[#0c447c] flex items-center justify-center text-white transition-colors">
                <PlusIcon className="w-3.5 h-3.5" />
              </button>
            </div>
        }
      </div>
    </div>
  )
}

export default function ShopDashboardView() {
  const { cart, addToCart, decreaseQuantity, regionFee } =
    useOutletContext<ShopOutletContextType>()

  const [search,         setSearch]    = useState('')
  const [activeCategory, setCategory]  = useState<string>('all')

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['Products'], queryFn: getProducts,
  })
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['Categories'], queryFn: getCategories,
  })

  const filtered = useMemo(() =>
    allProducts
      .filter(p => !search || p.productName.toLowerCase().includes(search.toLowerCase()))
      .filter(p =>
        activeCategory === 'all' ||
        (p.category && typeof p.category === 'object' && p.category._id === activeCategory)
      )
  , [allProducts, search, activeCategory])

  const getCartQty     = (id: string) => cart.find(i => i._id === id)?.quantity ?? 0
  const getDisplayPrice = (p: Product) => getEffectivePrice(p, regionFee)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-bold text-[#185fa5] text-3xl">Products</h1>
        <p className="text-[#5a7a9a] mt-1 text-sm">
          Add to cart your <span className="text-blue-500 font-semibold">favorite products</span>
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                     bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]" />
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <CategoryPill label="All" active={activeCategory === 'all'} onClick={() => setCategory('all')} />
          {categories.map(cat => (
            <CategoryPill key={cat._id} label={cat.name}
              active={activeCategory === cat._id} onClick={() => setCategory(cat._id)} />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">{filtered.length} products available</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filtered.length === 0
          ? <p className="col-span-2 sm:col-span-3 text-center py-16 text-gray-400 text-sm">No products found</p>
          : filtered.map(product => (
              <ProductCard
                key={product._id}
                product={product}
                cartQty={getCartQty(product._id)}
                displayPrice={getDisplayPrice(product)}
                onAdd={() => addToCart(product)}
                onSubtract={() => decreaseQuantity(product._id)}
              />
            ))
        }
      </div>
    </div>
  )
}