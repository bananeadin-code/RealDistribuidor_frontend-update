import api from '../lib/axios'
import type { Supplier, SupplierFormData } from '../types'

export const getSuppliers = async (): Promise<Supplier[]> => {
  const { data } = await api.get('/suppliers/all')
  return data
}

export const getSupplierById = async (id: string): Promise<Supplier> => {
  const { data } = await api.get(`/suppliers/${id}`)
  return data
}

export const createSupplier = async (formData: SupplierFormData): Promise<Supplier> => {
  const { data } = await api.post('/suppliers/create', formData)
  return data
}

export const updateSupplier = async ({
  id, formData,
}: { id: string; formData: SupplierFormData }): Promise<Supplier> => {
  const { data } = await api.put(`/suppliers/edit/${id}`, formData)
  return data
}

export const deleteSupplier = async (id: string): Promise<void> => {
  await api.delete(`/suppliers/delete/${id}`)
}