import api from '../lib/axios'
import type { Picker, PickerFormData, PickerSession, Sale } from '../types'

// Admin
export const getPickers = async (): Promise<Picker[]> => {
  const { data } = await api.get('/pickers')
  return data
}
export const createPicker = async (formData: PickerFormData): Promise<Picker> => {
  const { data } = await api.post('/pickers', formData)
  return data
}
export const updatePicker = async ({ id, formData }: { id: string; formData: PickerFormData }): Promise<Picker> => {
  const { data } = await api.put(`/pickers/${id}`, formData)
  return data
}
export const deletePicker = async (id: string): Promise<void> => {
  await api.delete(`/pickers/${id}`)
}
export const regeneratePickerCode = async (id: string): Promise<{ accessCode: string }> => {
  const { data } = await api.post(`/pickers/${id}/regenerate-code`)
  return data
}

// Portal del picker
export const pickerLogin = async (accessCode: string): Promise<PickerSession> => {
  const { data } = await api.post('/pickers/login', { accessCode })
  return data
}
export const getAvailableOrders = async (): Promise<Sale[]> => {
  const { data } = await api.get('/pickers/available-orders')
  return data
}
export const getMyOrders = async (pickerId: string): Promise<Sale[]> => {
  const { data } = await api.get(`/pickers/${pickerId}/orders`)
  return data
}
export const claimOrder = async ({ orderId, pickerId, pickerName }:
  { orderId: string; pickerId: string; pickerName: string }): Promise<Sale> => {
  const { data } = await api.post(`/pickers/orders/${orderId}/claim`, { pickerId, pickerName })
  return data
}
export const releaseOrder = async (orderId: string): Promise<Sale> => {
  const { data } = await api.post(`/pickers/orders/${orderId}/release`)
  return data
}