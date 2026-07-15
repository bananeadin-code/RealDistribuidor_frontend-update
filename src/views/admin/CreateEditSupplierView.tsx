import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import {
  getSupplierById, createSupplier, updateSupplier,
} from '../../api/SupplierAPI'
import type { SupplierFormData } from '../../types'

const DEFAULT: SupplierFormData = {
  name: '', email: '', phone: '', contactPerson: '',
  address: '', city: '', paymentTerms: '', notes: '',
}

const input = `w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
  text-gray-800 placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent transition`

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm font-semibold text-[#5a7a9a] mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label, required, children,
}: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function CreateEditSupplierView() {
  const { supplierId } = useParams<{ supplierId: string }>()
  const isEdit         = !!supplierId
  const navigate       = useNavigate()
  const queryClient    = useQueryClient()

  const [form, setForm] = useState<SupplierFormData>(DEFAULT)

  const { data: existing } = useQuery({
    queryKey: ['Supplier', supplierId],
    queryFn:  () => getSupplierById(supplierId!),
    enabled:  isEdit,
  })

  useEffect(() => {
    if (existing) setForm({
      name:          existing.name          ?? '',
      email:         existing.email         ?? '',
      phone:         existing.phone         ?? '',
      contactPerson: existing.contactPerson ?? '',
      address:       existing.address       ?? '',
      city:          existing.city          ?? '',
      paymentTerms:  existing.paymentTerms  ?? '',
      notes:         existing.notes         ?? '',
    })
  }, [existing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const createMut = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Suppliers'] })
      toast.success('Supplier created')
      navigate('/admin-view-privated/suppliers')
    },
    onError: () => toast.error('Could not create supplier'),
  })

  const updateMut = useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Suppliers'] })
      toast.success('Supplier updated')
      navigate('/admin-view-privated/suppliers')
    },
    onError: () => toast.error('Could not update supplier'),
  })

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) updateMut.mutate({ id: supplierId!, formData: form })
    else        createMut.mutate(form)
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#5a7a9a] hover:bg-blue-50 hover:text-[#185fa5] transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">
            {isEdit ? 'Edit Supplier' : 'New Supplier'}
          </h1>
          <p className="text-sm text-[#5a7a9a]">
            {isEdit ? 'Update supplier information' : 'Register a new supplier'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        <Section title="General Information">
          <Field label="Name" required>
            <input name="name" type="text" required value={form.name}
              onChange={handleChange} placeholder="Supplier name" className={input} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <input name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="email@example.com" className={input} />
            </Field>
            <Field label="Phone">
              <input name="phone" type="tel" value={form.phone}
                onChange={handleChange} placeholder="Phone number" className={input} />
            </Field>
          </div>
          <Field label="Contact Person">
            <input name="contactPerson" type="text" value={form.contactPerson}
              onChange={handleChange} placeholder="Contact person name" className={input} />
          </Field>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Address">
              <input name="address" type="text" value={form.address}
                onChange={handleChange} placeholder="Street address" className={input} />
            </Field>
            <Field label="City">
              <input name="city" type="text" value={form.city}
                onChange={handleChange} placeholder="City" className={input} />
            </Field>
          </div>
        </Section>

        <Section title="Commercial">
          <Field label="Payment Terms">
            <input name="paymentTerms" type="text" value={form.paymentTerms}
              onChange={handleChange} placeholder="e.g., Net 30, Net 60" className={input} />
          </Field>
          <Field label="Notes">
            <textarea name="notes" value={form.notes} onChange={handleChange}
              placeholder="Additional notes" rows={4}
              className={`${input} resize-none`} />
          </Field>
        </Section>

        {/* Botones */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white
                       border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-[#185fa5]
                       hover:bg-[#0c447c] disabled:opacity-60 rounded-xl transition-colors">
            {isPending
              ? (isEdit ? 'Updating...'     : 'Creating...')
              : (isEdit ? 'Update Supplier' : 'Create Supplier')}
          </button>
        </div>
      </form>
    </div>
  )
}