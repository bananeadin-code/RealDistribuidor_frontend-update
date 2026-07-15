// utils/pricing.ts
import type { Product } from '../types'

// Precio final que ve el cliente, considerando promo y region fee
export const getEffectivePrice = (product: Product, regionFee: number): number => {
  const hasPromo = (product.promotionalPrice ?? 0) > 0
  if (hasPromo) {
    return parseFloat((product.promotionalPrice ?? 0).toFixed(2))  // promo: sin fee
  }
  return parseFloat((product.salePrice + regionFee).toFixed(2))
}