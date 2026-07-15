import api from '../lib/axios'
import type { Region, RegionFormData } from '../types'

export const getRegions = async (): Promise<Region[]> => {
  const { data } = await api.get('/regions/all')
  return data
}

export const getRegionById = async (id: string): Promise<Region> => {
  const { data } = await api.get(`/regions/${id}`)
  return data
}

export const createRegion = async (formData: RegionFormData): Promise<Region> => {
  const { data } = await api.post('/regions/create', formData)
  return data
}

export const updateRegion = async ({
  id, formData,
}: { id: string; formData: RegionFormData }): Promise<Region> => {
  const { data } = await api.put(`/regions/${id}/edit`, formData)
  return data
}

export const deleteRegion = async (id: string): Promise<void> => {
  await api.delete(`/regions/${id}/delete`)
}