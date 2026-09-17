import { isAxiosError } from "axios"
import api from "../lib/axios"
import { type Product } from "../types"

export const createProduct = async (formData: FormData): Promise<Product> => {
  const { data } = await api.post('/products/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function getProducts(): Promise<Product[]> {
    try {
        const { data } = await api('/products')
        // Orden alfabético por nombre (aplica al panel admin, a la tienda del
        // cliente y a cualquier producto que se agregue después, ya que ambas
        // vistas consumen esta misma función).
        return (data as Product[]).sort((a, b) =>
            a.productName.localeCompare(b.productName, undefined, {
                sensitivity: 'base',
                numeric: true,
            })
        )
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}

export async function getProductById(id: Product['_id']): Promise<Product> {
    try {
        const { data } = await api(`/products/${id}`)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}

export const updateProduct = async ({
  id, formData,
}: { id: string; formData: FormData }): Promise<Product> => {
  const { data } = await api.put(`/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteProduct(productId : Product['_id']) {
    try {
        const url = `/products/${productId}`
        const { data } = await api.delete<string>(url)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response){
            throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}