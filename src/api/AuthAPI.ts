import api from "../lib/axios"
import { isAxiosError } from "axios"
import { adminDashboardSchema, type AdminLoginForm, type AdminRegistrationForm } from "../types"


export async function createAdmin(formData: AdminRegistrationForm) {
    try {
        const url = '/admin'
        const { data } = await api.post<string>(url, formData)
        return data
    } catch (error) {
        if(isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}

export async function login(formData: AdminLoginForm) {
    try {
        const url = '/admin/login'
        const { data } = await api.post<string>(url, formData)
        localStorage.setItem('AUTH_TOKEN', data)
    } catch (error) {
        if(isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}

export function logout() {
    localStorage.removeItem('AUTH_TOKEN')
}

export async function getUser() {
    try {
        const { data } = await api('admin/user')
        const response = adminDashboardSchema.safeParse(data)
        if(response.success){
            return response.data
        }
    } catch (error) {
        if(isAxiosError(error) && error.response) {
            throw new Error(error.response.data.error, { cause: error })
        }
        throw error
    }
}