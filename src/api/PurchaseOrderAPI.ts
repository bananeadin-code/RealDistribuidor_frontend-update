import api from '../lib/axios'
import type { PurchaseOrder, POFormData } from '../types'

export const getPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  const { data } = await api.get('/purchase-orders/all')
  return data
}

export const createPurchaseOrder = async (formData: POFormData) => {
  const { data } = await api.post('/purchase-orders/create', formData)
  return data
}

export const markAsSentPurchaseOrder = async (id: string): Promise<PurchaseOrder> => {
  const { data } = await api.patch(`/purchase-orders/${id}/send`)
  return data
}

export const receivePurchaseOrder = async ({
  id, items, freight,
}: {
  id: string
  items: { product: string; receivedQuantity: number }[]
  freight?: number
}): Promise<PurchaseOrder> => {
  const { data } = await api.patch(`/purchase-orders/${id}/receive`, { items, freight })
  return data
}

export const cleanupOldPOs = async (): Promise<{ deleted: number }> => {
  const { data } = await api.delete('/purchase-orders/cleanup-old')
  return data
}

export const cancelPurchaseOrder = async (id: string) => {
  const { data } = await api.patch(`/purchase-orders/${id}/cancel`)
  return data
}