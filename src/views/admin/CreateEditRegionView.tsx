import { useState, useEffect }                from 'react'
import { useParams, useNavigate }              from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, MapPinIcon }           from '@heroicons/react/24/outline'
import { toast }                               from 'react-toastify'

import {
  getRegionById, createRegion, updateRegion,
} from '../../api/RegionAPI'
import type { RegionFormData } from '../../types'

// ─── Estos sub-componentes van FUERA del componente principal ──────────────────
function FormField({
  label, hint, required, children,
}: {
  label:    string
  hint?:    string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && (
          <span className="text-xs font-normal text-[#5a7a9a] ml-1.5">{hint}</span>
        )}
      </label>
      {children}
    </div>
  )
}

const INPUT_CLS = `
  w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
  text-gray-800 placeholder-gray-400
  focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent
  transition
`

const DEFAULT: RegionFormData = { regionName: '', regionCode: '', deliveryFee: 0 }

// ─── Vista ─────────────────────────────────────────────────────────────────────
export default function CreateEditRegionView() {
  const { regionId } = useParams<{ regionId: string }>()
  const isEdit       = !!regionId
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()

  const [form, setForm] = useState<RegionFormData>(DEFAULT)

  const { data: existing } = useQuery({
    queryKey: ['Region', regionId],
    queryFn:  () => getRegionById(regionId!),
    enabled:  isEdit,
  })

  useEffect(() => {
    if (existing) setForm({
      regionName:  existing.regionName,
      regionCode:  existing.regionCode,
      deliveryFee: existing.deliveryFee,
    })
  }, [existing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }))
  }

  const createMut = useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Regions'] })
      toast.success('Region created')
      navigate('/admin-view-privated/manage-regions')
    },
    onError: () => toast.error('Could not create region'),
  })

  const updateMut = useMutation({
    mutationFn: updateRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Regions'] })
      toast.success('Region updated')
      navigate('/admin-view-privated/manage-regions')
    },
    onError: () => toast.error('Could not update region'),
  })

  const isPending = createMut.isPending || updateMut.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) updateMut.mutate({ id: regionId!, formData: form })
    else        createMut.mutate(form)
  }

  return (
    <div className="space-y-5 max-w-md mx-auto">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#5a7a9a] hover:bg-blue-50
                     hover:text-[#185fa5] transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">
            {isEdit ? 'Edit Region' : 'Add Region'}
          </h1>
          <p className="text-sm text-[#5a7a9a]">
            {isEdit
              ? 'Update the region information'
              : 'Fill in the details to register a new region'}
          </p>
        </div>
      </div>

      {/* Card formulario */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Cabecera coloreada */}
        <div className="bg-linear-to-r from-[#185fa5] to-sky-500 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MapPinIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-base">
                {isEdit ? 'Edit Region' : 'New Region'}
              </p>
              <p className="text-blue-100 text-xs mt-0.5">
                Extra fee applied per product for customers in this region
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          <FormField label="Region / State" required>
            <input
              name="regionName"
              type="text"
              required
              autoFocus={!isEdit}
              value={form.regionName}
              onChange={handleChange}
              placeholder="e.g. California"
              className={INPUT_CLS}
            />
          </FormField>

          <FormField
            label="Region Code"
            required
            hint="short identifier (1–3 chars)"
          >
            <input
              name="regionCode"
              type="text"
              required
              maxLength={3}
              value={form.regionCode}
              onChange={e =>
                setForm(prev => ({
                  ...prev,
                  regionCode: e.target.value.toUpperCase(),
                }))
              }
              placeholder="e.g. W"
              className={`${INPUT_CLS} uppercase tracking-widest font-bold`}
            />
          </FormField>

          <FormField
            label="Extra Fee per Product ($)"
            hint="added to each product's price for this region"
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400
                               text-sm font-medium">
                $
              </span>
              <input
                name="deliveryFee"
                type="number"
                min={0}
                step="0.01"
                value={form.deliveryFee}
                onChange={handleChange}
                placeholder="0.00"
                className={`${INPUT_CLS} pl-7`}
              />
            </div>
          </FormField>

          {/* Preview del código */}
          {(form.regionName || form.regionCode) && (
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-xl
                            border border-blue-100">
              <div className="w-9 h-9 rounded-xl bg-lienar-to-br from-blue-500 to-sky-400
                              flex items-center justify-center shadow-sm shrink-0">
                <span className="text-white font-black text-sm">
                  {form.regionCode?.slice(0, 2) || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#1a3a5c] text-sm truncate">
                  {form.regionName || 'Region name'}
                </p>
                <p className="text-xs text-[#5a7a9a] mt-0.5">
                  +${form.deliveryFee.toFixed(2)} per product
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3 text-sm font-medium text-gray-600 bg-white
                         border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 text-sm font-semibold text-white bg-[#185fa5]
                         hover:bg-[#0c447c] disabled:opacity-60 rounded-xl transition-colors"
            >
              {isPending
                ? (isEdit ? 'Updating...'    : 'Creating...')
                : (isEdit ? 'Update Region'  : 'Add Region')}
            </button>
          </div>
        </form>
      </div>

    </div>
  )
}