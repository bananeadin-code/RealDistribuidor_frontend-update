import api from '../lib/axios'
import type { Seller, SellerFormData, SellerSession, Customer, Sale } from '../types'

// Admin
export const getSellers = async (): Promise<Seller[]> => {
  const { data } = await api.get('/sellers')
  return data
}
export const createSeller = async (formData: SellerFormData): Promise<Seller> => {
  const { data } = await api.post('/sellers', formData)
  return data
}
export const updateSeller = async ({ id, formData }: { id: string; formData: SellerFormData }): Promise<Seller> => {
  const { data } = await api.put(`/sellers/${id}`, formData)
  return data
}
export const deleteSeller = async (id: string): Promise<void> => {
  await api.delete(`/sellers/${id}`)
}
export const regenerateSellerCode = async (id: string): Promise<{ accessCode: string }> => {
  const { data } = await api.post(`/sellers/${id}/regenerate-code`)
  return data
}

// Portal del vendedor
export const sellerLogin = async (accessCode: string): Promise<SellerSession> => {
  const { data } = await api.post('/sellers/login', { accessCode })
  return data
}
export const getMyCustomers = async (sellerId: string): Promise<Customer[]> => {
  const { data } = await api.get(`/sellers/${sellerId}/customers`)
  return data
}
export const getMySellerOrders = async (sellerId: string): Promise<Sale[]> => {
  const { data } = await api.get(`/sellers/${sellerId}/orders`)
  return data
}
