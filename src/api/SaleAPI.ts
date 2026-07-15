import api from '../lib/axios'
import type { Sale, SaleFormData, SaleStatus } from '../types'

export const getSales = async () => {
    const { data } = await api.get('/sales/all')
  return data
}

export const getCompletedOrders = async () => {
    const { data } = await api.get('/sales/completed')
  return data
}

export const createSale = async (formData: SaleFormData): Promise<Sale> => {
    const { data } = await api.post('/sales/create', formData)
  return data
}

export const updateSaleStatus = async ({
  id, status,
}: { id: string; status: SaleStatus }): Promise<Sale> => {
    const { data } = await api.patch(`/sales/${id}/edit`, { status })
  return data
}

export const updateSaleNotes = async ({
  id, notes, deliveryExtraAmount,
}: { id: string; notes: string; deliveryExtraAmount?: number }): Promise<Sale> => {
  const { data } = await api.patch(`/sales/${id}/notes`, { notes, deliveryExtraAmount })
  return data
}

export const createShopOrder = async (
  formData: Omit<SaleFormData, 'customer'> & { customer: string | null }
): Promise<Sale> => {
  const { data } = await api.post('/sales/shop', formData)
  return data
}

export const getPendingOrders = async (): Promise<Sale[]> => {
  const { data } = await api.get('/sales/pending')
  return data
}
export const getPendingCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get('/sales/pending-count')
  return data
}
export const fulfillOrder = async ({ id, items, pickerId, pickerName }:
  { id: string; items: { product: string; pickedQuantity: number }[]; pickerId: string; pickerName: string }
): Promise<Sale> => {
  const { data } = await api.patch(`/sales/${id}/fulfill`, { items, pickerId, pickerName })
  return data
}
export const cleanupOldSales = async (): Promise<{ deleted: number }> => {
  const { data } = await api.delete('/sales/cleanup-old')
  return data
}