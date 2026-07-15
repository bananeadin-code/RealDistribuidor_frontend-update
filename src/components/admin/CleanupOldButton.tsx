// components/Admin/CleanupOldButton.tsx
import { useState }                      from 'react'
import { useMutation, useQueryClient }    from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import { TrashIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

export default function CleanupOldButton({
  mutationFn, queryKey, label = 'Clean old records',
}: {
  mutationFn: () => Promise<{ deleted: number }>
  queryKey:   string
  label?:     string
}) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const mut = useMutation({
    mutationFn,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] })
      setOpen(false)
      toast.success(`${res.deleted} old records deleted`)
    },
    onError: () => toast.error('Could not clean records'),
  })

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                   text-gray-500 bg-white border border-gray-200 hover:bg-gray-50
                   rounded-xl transition-colors">
        <ArchiveBoxXMarkIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
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
              <p className="font-bold text-[#1a3a5c] text-lg">Clean Old Records</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              This will permanently delete the <strong>30 oldest records</strong> to free up space.
              This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={() => mut.mutate()} disabled={mut.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl">
                {mut.isPending ? 'Deleting...' : 'Delete 30 oldest'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}