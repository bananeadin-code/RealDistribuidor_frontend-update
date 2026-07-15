import { useState }                                          from 'react'
import { useNavigate }                                       from 'react-router-dom'
import { useQuery, useMutation, useQueryClient }              from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }                from '@headlessui/react'
import {
  PlusIcon, PencilSquareIcon, TrashIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import { getRegions, deleteRegion } from '../../api/RegionAPI'
import type { Region }              from '../../types'

// ─── Avatar de código ──────────────────────────────────────────────────────────
function CodeBadge({ code }: { code: string }) {
  return (
    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-sky-400
                    flex items-center justify-center shrink-0 shadow-sm">
      <span className="text-white font-black text-sm uppercase">
        {code?.slice(0, 2) ?? '?'}
      </span>
    </div>
  )
}

// ─── RegionCard (mobile) ───────────────────────────────────────────────────────
function RegionCard({
  region, onEdit, onDelete,
}: {
  region:   Region
  onEdit:   () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                    flex items-center gap-4">
      <CodeBadge code={region.regionCode} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-800 text-sm truncate">{region.regionName}</p>
        <p className="text-xs text-gray-400 mt-0.5">Code: {region.regionCode}</p>
      </div>
      <p className="font-black text-[#185fa5] text-base shrink-0">
        +${region.deliveryFee.toFixed(2)}
      </p>
      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={onEdit} title="Edit"
          className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50
                     rounded-lg transition-colors">
          <PencilSquareIcon className="w-4 h-4" />
        </button>
        <button onClick={onDelete} title="Delete"
          className="p-1.5 text-[#5a7a9a] hover:text-red-500 hover:bg-red-50
                     rounded-lg transition-colors">
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function AdminManageRegionsView() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const [deleting, setDeleting] = useState<Region | null>(null)

  const { data: regions = [], isLoading } = useQuery<Region[]>({
    queryKey: ['Regions'],
    queryFn:  getRegions,
  })

  const deleteMut = useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Regions'] })
      setDeleting(null)
      toast.success('Region deleted')
    },
    onError: () => toast.error('Could not delete region'),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading regions...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">Region Fees</h1>
          <p className="text-sm text-[#5a7a9a] mt-0.5">
            Extra amount added per product by region
          </p>
        </div>
        <button
          onClick={() => navigate('/admin-view-privated/manage-regions/create')}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold
                     text-white bg-[#185fa5] hover:bg-[#0c447c] rounded-xl transition-colors
                     shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Add Region</span>
        </button>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {regions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center
                            justify-center mb-4">
              <MapPinIcon className="w-7 h-7 text-[#185fa5]/40" />
            </div>
            <p className="text-gray-400 text-sm">No regions registered yet</p>
          </div>
        ) : regions.map(region => (
          <RegionCard
            key={region._id}
            region={region}
            onEdit={() => navigate(`/admin-view-privated/manage-regions/${region._id}/edit`)}
            onDelete={() => setDeleting(region)}
          />
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100
                      overflow-hidden">
        {regions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center
                            justify-center mb-4">
              <MapPinIcon className="w-7 h-7 text-[#185fa5]/40" />
            </div>
            <p className="text-gray-400 text-sm">No regions registered yet</p>
            <button
              onClick={() => navigate('/admin-view-privated/manage-regions/create')}
              className="mt-3 text-sm text-[#185fa5] font-semibold hover:underline"
            >
              Add your first region
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a3a5c] text-white text-xs uppercase tracking-wide">
                <th className="px-5 py-3.5 text-left font-semibold w-20">Code</th>
                <th className="px-5 py-3.5 text-left font-semibold">Region / State</th>
                <th className="px-5 py-3.5 text-left font-semibold">Extra Fee per Product</th>
                <th className="px-5 py-3.5 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {regions.map(region => (
                <tr key={region._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <CodeBadge code={region.regionCode} />
                  </td>
                  <td className="px-5 py-4 font-semibold text-gray-800">
                    {region.regionName}
                  </td>
                  <td className="px-5 py-4 font-bold text-[#185fa5]">
                    +${region.deliveryFee.toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() =>
                          navigate(`/admin-view-privated/manage-regions/${region._id}/edit`)
                        }
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-[#185fa5]
                                   hover:bg-[#0c447c] rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(region)}
                        className="px-3 py-1.5 text-xs font-semibold text-red-500
                                   border border-red-200 hover:bg-red-50 rounded-lg
                                   transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmar borrado */}
      <Dialog open={!!deleting} onClose={() => setDeleting(null)} className="relative z-50">
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
              <p className="font-bold text-[#1a3a5c] text-lg">Delete Region</p>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-gray-700">{deleting?.regionName}</span>
              ? Customers assigned to this region will lose their fee reference.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100
                           hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button
                onClick={() => deleteMut.mutate(deleting!._id)}
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