import api from '../lib/axios'
import type { Customer, CustomerFormData, ShopCustomer } from '../types'

export const getCustomers = async (): Promise<Customer[]> => {
  const { data } = await api.get('/customers/all')
  return data
}

export const createCustomer = async (formData: CustomerFormData): Promise<Customer> => {
  const { data } = await api.post('/customers/create', formData)
  return data
}

export const updateCustomer = async ({
  id, formData,
}: { id: string; formData: CustomerFormData }): Promise<Customer> => {
  const { data } = await api.put(`/customers/${id}/edit`, formData)
  return data
}

export const deleteCustomer = async (id: string): Promise<void> => {
  await api.delete(`/customers/${id}/delete`)
}

export const shopLogin = async ({
  email, accessCode,
}: { email: string; accessCode: string }): Promise<ShopCustomer> => {
  const { data } = await api.post('/customers/shop-login', { email, accessCode })
  return data
}

export const regenerateAccessCode = async (id: string): Promise<{ accessCode: string }> => {
  const { data } = await api.post(`/customers/${id}/regenerate-code`)
  return data
}