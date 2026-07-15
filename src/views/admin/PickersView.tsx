import { useState }                              from 'react'
import { useQuery, useMutation, useQueryClient }  from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }    from '@headlessui/react'
import {
  PlusIcon, PencilSquareIcon, TrashIcon, XMarkIcon, ClipboardDocumentIcon, ArrowPathIcon,
  TruckIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import {
  getPickers, createPicker, updatePicker, deletePicker, regeneratePickerCode,
} from '../../api/PickerAPI'
import type { Picker, PickerFormData } from '../../types'

const initials = (name: string) =>
  name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

// ─── Regenerate button ─────────────────────────────────────────────────────────
function RegenButton({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const mut = useMutation({
    mutationFn: () => regeneratePickerCode(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Pickers'] })
      toast.success('New code generated')
    },
    onError: () => toast.error('Could not regenerate'),
  })
  return (
    <button onClick={() => mut.mutate()} disabled={mut.isPending} title="New code"
      className="p-1.5 text-[#5a7a9a] hover:text-amber-500 hover:bg-amber-50
                 rounded-lg transition-colors disabled:opacity-40">
      <ArrowPathIcon className={`w-4 h-4 ${mut.isPending ? 'animate-spin' : ''}`} />
    </button>
  )
}

// ─── Form modal ────────────────────────────────────────────────────────────────
function PickerFormModal({
  open, picker, onClose,
}: {
  open: boolean; picker: Picker | null; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const isEdit      = !!picker
  const [name, setName] = useState(picker?.name ?? '')

  const createMut = useMutation({
    mutationFn: createPicker,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['Pickers'] }); toast.success('Picker created'); onClose() },
    onError:   () => toast.error('Could not create picker'),
  })
  const updateMut = useMutation({
    mutationFn: updatePicker,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['Pickers'] }); toast.success('Picker updated'); onClose() },
    onError:   () => toast.error('Could not update picker'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const formData: PickerFormData = { name: name.trim() }
    if (isEdit) updateMut.mutate({ id: picker!._id, formData })
    else        createMut.mutate(formData)
  }

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel transition
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl
                     transition-all duration-200 data-closed:scale-95 data-closed:opacity-0">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <p className="font-bold text-[#1a3a5c] text-lg">{isEdit ? 'Edit Picker' : 'New Picker'}</p>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input type="text" required autoFocus value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Picker name"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl
                           focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]" />
            </div>
            {!isEdit && (
              <p className="text-xs text-gray-400">
                A 6-digit access code will be generated automatically.
              </p>
            )}
            <button type="submit" disabled={createMut.isPending || updateMut.isPending}
              className="w-full py-3 text-sm font-semibold text-white bg-[#185fa5]
                         hover:bg-[#0c447c] disabled:opacity-60 rounded-xl transition-colors">
              {isEdit ? 'Update Picker' : 'Create Picker'}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function PickersView() {
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen]   = useState(false)
  const [editing,  setEditing]    = useState<Picker | null>(null)
  const [deleting, setDeleting]   = useState<Picker | null>(null)

  const { data: pickers = [], isLoading } = useQuery<Picker[]>({
    queryKey: ['Pickers'], queryFn: getPickers,
  })

  const deleteMut = useMutation({
    mutationFn: deletePicker,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Pickers'] })
      setDeleting(null); toast.success('Picker deleted')
    },
    onError: () => toast.error('Could not delete picker'),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading pickers...</p>
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">Pickers</h1>
          <p className="text-sm text-[#5a7a9a] mt-0.5">Manage your dispatch staff</p>
        </div>
        <button onClick={() => { setEditing(null); setFormOpen(true) }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                     text-white bg-[#185fa5] hover:bg-[#0c447c] rounded-xl transition-colors shrink-0">
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">New Picker</span>
        </button>
      </div>

      {pickers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <TruckIcon className="w-7 h-7 text-[#185fa5]/40" />
          </div>
          <p className="text-gray-400 text-sm">No pickers registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pickers.map(picker => (
            <div key={picker._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-[#185fa5]/10 flex items-center
                                justify-center shrink-0 border-2 border-[#185fa5]/20">
                  <span className="text-[#185fa5] font-bold text-sm">{initials(picker.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{picker.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {picker.dispatchedCount ?? 0} orders dispatched
                  </p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => { setEditing(picker); setFormOpen(true) }} title="Edit"
                    className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50 rounded-lg transition-colors">
                    <PencilSquareIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleting(picker)} title="Delete"
                    className="p-1.5 text-[#5a7a9a] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Access code */}
              {picker.accessCode && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                      Access Code
                    </p>
                    <p className="font-mono font-bold text-[#185fa5] text-base tracking-widest mt-0.5">
                      {picker.accessCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigator.clipboard.writeText(picker.accessCode!)
                        .then(() => toast.success('Code copied'))}
                      title="Copy"
                      className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50 rounded-lg transition-colors">
                      <ClipboardDocumentIcon className="w-4 h-4" />
                    </button>
                    <RegenButton id={picker._id} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <PickerFormModal
        key={editing?._id ?? 'new'}
        open={formOpen}
        picker={editing}
        onClose={() => { setFormOpen(false); setTimeout(() => setEditing(null), 300) }}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} className="relative z-50">
        <DialogBackdrop transition
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel transition
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6
                       transition-all duration-200 data-closed:scale-95 data-closed:opacity-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <TrashIcon className="w-5 h-5 text-red-500" />
              </div>
              <p className="font-bold text-[#1a3a5c] text-lg">Delete Picker</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Delete <span className="font-semibold text-gray-700">{deleting?.name}</span>?
              Their assigned orders will return to the available pool.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={() => deleteMut.mutate(deleting!._id)} disabled={deleteMut.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl">
                {deleteMut.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  )
}