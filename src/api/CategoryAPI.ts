import { isAxiosError } from 'axios'
import api from '../lib/axios'

export const getCategories = async () => {
    try {
        const { data } = await api('/categories/all')
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}

export const createCategory = async (name: string) => {
    try {
        const { data } = await api.post('/categories/create', { name })
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}

export const deleteCategory = async (id: string): Promise<void> => {
    try {
        await api.delete(`/categories/delete/${id}`)
    } catch (error) {
        if(isAxiosError(error) && error.response) {
          throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}