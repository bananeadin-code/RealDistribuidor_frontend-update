import { useState, useEffect, useMemo } from 'react'
import type { ShopCartItem, Product }   from '../types'

const CART_KEY = 'rd_shop_cart'

const readCart = (): ShopCartItem[] => {
  try {
    const raw = sessionStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function useShopCart(regionFee: number = 0) {
  const [rawCart, setCart] = useState<ShopCartItem[]>(readCart)

  // Persiste en sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(CART_KEY, JSON.stringify(rawCart)) }
    catch { /* sessionStorage unavailable (e.g. private browsing) */ }
  }, [rawCart])

  // displayPrice se deriva de basePrice + regionFee (los items en promo no llevan fee).
  const cart = useMemo(() => rawCart.map(i => ({
    ...i,
    displayPrice: i.isPromo
      ? i.basePrice
      : parseFloat((i.basePrice + regionFee).toFixed(2)),
  })), [rawCart, regionFee])

  const addToCart = (product: Product) => {
    const hasPromo  = (product.promotionalPrice ?? 0) > 0
    // Si está en promo, el precio base ES el promocional; si no, el precio de venta normal
    const basePrice = hasPromo ? (product.promotionalPrice ?? 0) : product.salePrice
    // El precio mostrado: promo no lleva fee, regular sí
    const displayPrice = hasPromo
      ? basePrice
      : parseFloat((basePrice + regionFee).toFixed(2))

    setCart(prev => {
      const idx = prev.findIndex(i => i._id === product._id)
      if (idx >= 0) {
        return prev.map((i, n) =>
          n === idx ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, {
        _id:          product._id,
        productName:  product.productName,
        basePrice,
        displayPrice,
        isPromo:      hasPromo,
        quantity:     1,
        image:        product.image,
        barcode:      product.barcode,
        category:     product.category && typeof product.category === 'object'
                        ? { _id: product.category._id, name: product.category.name }
                        : null,
        weightPerPiece: product.weightPerPiece ?? 0
      }]
    })
  }

  const removeFromCart   = (id: string) =>
    setCart(prev => prev.filter(i => i._id !== id))

  const increaseQuantity = (id: string) =>
    setCart(prev => prev.map(i => i._id === id ? { ...i, quantity: i.quantity + 1 } : i))

  const decreaseQuantity = (id: string) =>
    setCart(prev =>
      prev
        .map(i => i._id === id ? { ...i, quantity: i.quantity - 1 } : i)
        .filter(i => i.quantity > 0)
    )

  const clearCart = () => {
    setCart([])
    try { sessionStorage.removeItem(CART_KEY) } catch { /* sessionStorage unavailable */ }
  }

  const isEmpty   = useMemo(() => cart.length === 0, [cart])
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart])
  const cartTotal = useMemo(() =>
    parseFloat(cart.reduce((s, i) => s + i.displayPrice * i.quantity, 0).toFixed(2))
  , [cart])

  return {
    cart, addToCart, removeFromCart,
    increaseQuantity, decreaseQuantity, clearCart,
    isEmpty, cartCount, cartTotal,
  }
}