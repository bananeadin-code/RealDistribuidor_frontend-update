import { useEffect, useState }                                          from 'react'
import { useQuery, useMutation, useQueryClient }              from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }                from '@headlessui/react'
import {
  MagnifyingGlassIcon, PlusIcon, UsersIcon,
  PhoneIcon, MapPinIcon, EnvelopeIcon,
  DocumentTextIcon, PencilSquareIcon, TrashIcon, XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../../api/CustomerAPI'
import type { Customer, CustomerFormData }                              from '../../types'
import { getRegions } from '../../api/RegionAPI'
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { regenerateAccessCode } from '../../api/CustomerAPI'

// ─── Constantes ────────────────────────────────────────────────────────────────
const DEFAULT_FORM: CustomerFormData = {
  name: '', phone: '', email: '', address: '', notes: '', region: ''
}

const INPUT_CLS = `
  w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
  text-gray-800 placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent
  transition
`
const initials = (name: string) =>
  name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

const regionLabel = (r: Customer['region']) => r && typeof r === 'object' ? `[${r.regionCode}] ${r.regionName}` : null

function FormField({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function CustomerAvatar({ name }: { name: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center
                    justify-center shrink-0 border-2 border-emerald-200">
      <span className="text-emerald-700 font-bold text-sm">{initials(name)}</span>
    </div>
  )
}

function RegenerateButton({ customerId }: { customerId: string }) {
  const queryClient = useQueryClient()
  const regen = useMutation({
    mutationFn: () => regenerateAccessCode(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Customers'] })
      toast.success('New code generated')
    },
    onError: () => toast.error('Could not regenerate code'),
  })
  return (
    <button onClick={() => regen.mutate()} disabled={regen.isPending}
      title="Generate new code"
      className="p-1.5 text-[#5a7a9a] hover:text-amber-500 hover:bg-amber-50
                 rounded-lg transition-colors disabled:opacity-40">
      <ArrowPathIcon className={`w-4 h-4 ${regen.isPending ? 'animate-spin' : ''}`} />
    </button>
  )
}

// ─── CustomerCard ──────────────────────────────────────────────────────────────
function CustomerCard({
  customer, onEdit, onDelete,
}: {
  customer: Customer
  onEdit:   () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <CustomerAvatar name={customer.name} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm leading-snug truncate">
            {customer.name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {customer.visitCount ?? 0}{' '}
            {(customer.visitCount ?? 0) === 1 ? 'visit' : 'visits'}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={onEdit} title="Edit"
            className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5]
                       hover:bg-blue-50 rounded-lg transition-colors">
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button onClick={onDelete} title="Delete"
            className="p-1.5 text-[#5a7a9a] hover:text-red-500
                       hover:bg-red-50 rounded-lg transition-colors">
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {customer.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <PhoneIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{customer.phone}</span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <EnvelopeIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="break-all">{customer.email}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="wrap-break-word leading-snug">{customer.address} </span>
          </div>
        )}

        {regionLabel(customer.region) && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="flex items-center gap-1.5">
              {regionLabel(customer.region)}
              {customer.region && typeof customer.region === 'object' && (
                <span className="text-[10px] font-semibold text-[#185fa5] bg-blue-50
                                 border border-blue-100 px-1.5 py-0.5 rounded-full">
                  +${customer.region.deliveryFee.toFixed(2)}/product
                </span>
              )}
            </span>
          </div>
        )}

        {customer.notes && (
          <div className="flex items-start gap-2 text-sm text-gray-500">
            <DocumentTextIcon className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <span className="wrap-break-word leading-snug italic">{customer.notes}</span>
          </div>
        )}
      </div>

      {/* Access code section */}
      {customer.accessCode && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                Store Access Code
              </p>
              <p className="font-mono font-bold text-[#185fa5] text-base tracking-widest mt-0.5">
                {customer.accessCode}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigator.clipboard.writeText(customer.accessCode!)
                  .then(() => toast.success('Code copied'))}
                title="Copy code"
                className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50
                           rounded-lg transition-colors"
              >
                <ClipboardDocumentIcon className="w-4 h-4" />
              </button>
              <RegenerateButton customerId={customer._id} />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─── CustomerFormModal ─────────────────────────────────────────────────────────
function CustomerFormModal({
  open,
  customer,
  onClose,
}: {
  open:      boolean
  customer:  Customer | null   // null = crear, objeto = editar
  onClose:   () => void
}) {
  const queryClient = useQueryClient()
  const isEdit      = !!customer

  const [form, setForm] = useState<CustomerFormData>(DEFAULT_FORM)

  const { data: regions = [] } = useQuery({
    queryKey: ['Regions'],
    queryFn: getRegions
  })

  const selectedRegion = regions.find(r => r._id === form.region) ?? null

  useEffect(() => {
  if (!open) return
  setForm(
    customer
      ? {
          name:    customer.name    ?? '',
          phone:   customer.phone   ?? '',
          email:   customer.email   ?? '',
          address: customer.address ?? '',
          notes:   customer.notes   ?? '',
          region:  customer.region?._id  ?? '',
        }
      : DEFAULT_FORM
  )
}, [open, customer])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const createMut = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Customers'] })
      toast.success('Customer created')
      onClose()
    },
    onError: () => toast.error('Could not create customer'),
  })

  const updateMut = useMutation({
    mutationFn: updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Customers'] })
      toast.success('Customer updated')
      onClose()
    },
    onError: () => toast.error('Could not update customer'),
  })

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) updateMut.mutate({ id: customer!._id, formData: form })
    else        createMut.mutate(form)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="relative z-50"
    >
      {/* El onOpen de Dialog no existe en HUI v2 — usamos el truco de key para resetear */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl
                     shadow-2xl flex flex-col max-h-[92vh]
                     transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:data-closed:scale-95 sm:data-closed:opacity-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4
                          border-b border-gray-100 shrink-0">
            <p className="font-bold text-[#1a3a5c] text-lg">
              {isEdit ? 'Edit Customer' : 'Add Customer'}
            </p>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                         hover:bg-gray-100 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Form scrollable */}
          <form
            id="customer-form"
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto min-h-0 px-5 py-5 space-y-4"
          >
            <FormField label="Name" required>
              <input
                name="name"
                type="text"
                required
                autoFocus
                value={form.name}
                onChange={handleChange}
                placeholder="Customer name"
                className={INPUT_CLS}
              />
            </FormField>

            <FormField label="Phone">
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 (000) 000-0000"
                className={INPUT_CLS}
              />
            </FormField>

            <FormField label="Email">
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className={INPUT_CLS}
              />
            </FormField>

            <FormField label="Address">
              <input
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                placeholder="Full address"
                className={INPUT_CLS}
              />
            </FormField>

            <FormField label="Region">
              <select
                name="region"
                value={form.region}
                onChange={handleChange}
                className={INPUT_CLS}
              >
                <option value="">— No region assigned —</option>
                {regions.map(r => (
                  <option key={r._id} value={r._id}>
                    [{r.regionCode}] {r.regionName}
                  </option>
                ))}
              </select>
              
              {selectedRegion && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50
                                rounded-xl border border-blue-100">
                  <div className="w-6 h-6 rounded-lg bg-linear-to-br from-blue-500 to-sky-400
                                  flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-[10px]">
                      {selectedRegion.regionCode.slice(0, 2)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5a7a9a]">
                    <span className="font-semibold text-[#185fa5]">
                      +${selectedRegion.deliveryFee.toFixed(2)}
                    </span>
                    {' '}extra fee per product will be applied
                  </p>
                </div>
              )}
            </FormField>

            <FormField label="Notes">
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes..."
                rows={3}
                className={`${INPUT_CLS} resize-none`}
              />
            </FormField>
          </form>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-2 shrink-0">
            <button
              type="submit"
              form="customer-form"
              disabled={isPending}
              className="w-full py-3 text-sm font-semibold text-white
                         bg-[#185fa5] hover:bg-[#0c447c]
                         disabled:opacity-60 rounded-xl transition-colors"
            >
              {isPending
                ? (isEdit ? 'Updating...'     : 'Creating...')
                : (isEdit ? 'Update Customer' : 'Create Customer')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 text-sm font-medium text-gray-600
                         bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function CustomersView() {
  const queryClient = useQueryClient()

  const [search,           setSearch]           = useState('')
  const [formOpen,         setFormOpen]         = useState(false)
  const [editingCustomer,  setEditingCustomer]  = useState<Customer | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null)

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ['Customers'],
    queryFn:  getCustomers,
  })

  const deleteMut = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Customers'] })
      setDeletingCustomer(null)
      toast.success('Customer deleted')
    },
    onError: () => toast.error('Could not delete customer'),
  })

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone  ?? '').includes(search) ||
    (c.email  ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    // Limpia el cliente en edición con un pequeño delay
    // para que no se vea el título cambiar mientras cierra
    setTimeout(() => setEditingCustomer(null), 300)
  }

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading customers...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1a3a5c]">Customers</h1>
        <p className="text-sm text-[#5a7a9a] mt-0.5">
          {customers.length}{' '}
          {customers.length === 1 ? 'registered customer' : 'registered customers'}
        </p>
      </div>

      {/* Add Customer */}
      <button
        onClick={() => { setEditingCustomer(null); setFormOpen(true) }}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                   px-5 py-3 text-sm font-semibold text-white
                   bg-[#185fa5] hover:bg-[#0c447c] rounded-xl transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Customer
      </button>

      {/* Buscador */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]"
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search customers..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                     bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
        />
      </div>

      {/* Grid de cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center
                          justify-center mb-4">
            <UsersIcon className="w-7 h-7 text-[#185fa5]/40" />
          </div>
          <p className="text-gray-400 text-sm">
            {search ? 'No customers match your search' : 'No customers registered yet'}
          </p>
          {!search && (
            <button
              onClick={() => setFormOpen(true)}
              className="mt-3 text-sm text-[#185fa5] font-semibold hover:underline"
            >
              Add your first customer
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(customer => (
            <CustomerCard
              key={customer._id}
              customer={customer}
              onEdit={()   => handleEdit(customer)}
              onDelete={()  => setDeletingCustomer(customer)}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <CustomerFormModal
        key={editingCustomer?._id ?? 'new'}
        open={formOpen}
        customer={editingCustomer}
        onClose={handleCloseForm}
      />

      {/* Confirmar borrado */}
      <Dialog
        open={!!deletingCustomer}
        onClose={() => setDeletingCustomer(null)}
        className="relative z-50"
      >
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm
                     transition-opacity duration-200 data-closed:opacity-0"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6
                       transition-all duration-200
                       data-closed:scale-95 data-closed:opacity-0"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center
                              justify-center shrink-0">
                <TrashIcon className="w-5 h-5 text-red-500" />
              </div>
              <p className="font-bold text-[#1a3a5c] text-lg">Delete Customer</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-700">
                {deletingCustomer?.name}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                           hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deletingCustomer!._id)}
                disabled={deleteMut.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500
                           hover:bg-red-600 disabled:opacity-50 rounded-xl transition-colors"
              >
                {deleteMut.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

    </div>
  )
}