import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import { getProductById, createProduct, updateProduct } from '../../api/ProductAPI'
import { getCategories }                               from '../../api/CategoryAPI'
import type { Category, Product, ProductFormData, UnitOfMeasure } from '../../types'
import { getSuppliers } from '../../api/SupplierAPI'

// ─────────────────────────────────────────────────────────────────────────────
const UNITS: { value: UnitOfMeasure; label: string }[] = [
  { value: 'unit',   label: 'Unit'          },
  { value: 'kg',     label: 'Kilogram (kg)' },
  { value: 'lb',     label: 'Pound (lb)'    },
  { value: 'box',    label: 'Box'           },
  { value: 'case',   label: 'Case'          },
  { value: 'pallet', label: 'Pallet'        },
]

const DEFAULT_FORM: ProductFormData = {
  productName: '', category: '', unitOfMeasure: 'unit',
  barcode: '', expirationDate: '', stock: 0, supplier: '', image: '',
  salePrice: 0, promotionalPrice: 0, pricePerPiece: 0,
  promotionalPricePerPiece: 0, cost: 0,
  piecesPerBox: 0, unitsPerPallet: 0, boxesPerLayer: 0, layersPerPallet: 0,
  weightPerBox: 0, weightPerPiece: 0, freight: 0, totalCost: 0,
}

const supplierId = (s: Product['supplier']) =>
  s && typeof s === 'object' ? s._id : ''

const toFormData = (p: Product): ProductFormData => ({
  productName:               p.productName,
  category:                  p.category?._id ?? '',
  unitOfMeasure:             p.unitOfMeasure,
  barcode:                   p.barcode ?? '',
  expirationDate:            p.expirationDate ? p.expirationDate.split('T')[0] : '',
  stock:                     p.stock,
  supplier:                  supplierId(p.supplier),
  image:                     p.image ?? '',
  salePrice:                 p.salePrice,
  promotionalPrice:          p.promotionalPrice         ?? 0,
  pricePerPiece:             p.pricePerPiece            ?? 0,
  promotionalPricePerPiece:  p.promotionalPricePerPiece ?? 0,
  cost:                      p.cost                     ?? 0,
  piecesPerBox:              p.piecesPerBox             ?? 0,
  unitsPerPallet:            p.unitsPerPallet           ?? 0,
  boxesPerLayer:             p.boxesPerLayer            ?? 0,
  layersPerPallet:           p.layersPerPallet          ?? 0,
  weightPerBox:              p.weightPerBox             ?? 0,
  weightPerPiece:            p.weightPerPiece           ?? 0,
  freight:                   p.freight                  ?? 0,
  totalCost:                 p.totalCost                ?? 0
})

// ─── Sub-componentes de layout ─────────────────────────────────────────────────
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <p className="text-sm font-semibold text-[#5a7a9a] mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint  && <span className="text-xs font-normal text-emerald-600 ml-1.5">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const input = `w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
  text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
  focus:ring-[#4a7fb5] focus:border-transparent transition`

// ─────────────────────────────────────────────────────────────────────────────
export default function CreateEditProductView() {
  const { productId } = useParams<{ productId: string }>()
  const isEdit        = !!productId
  const navigate      = useNavigate()
  const queryClient   = useQueryClient()

  const [form,         setForm]         = useState<ProductFormData>(DEFAULT_FORM)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  // Texto crudo de los campos numéricos mientras se editan. Se manejan como
  // texto (no type="number") para que el separador decimal no borre el campo
  // en dispositivos/idiomas con coma decimal.
  const [rawNumbers, setRawNumbers] = useState<Record<string, string>>({})

  // Fetch en modo edición
  const { data: existing } = useQuery<Product>({
    queryKey: ['Product', productId],
    queryFn:  () => getProductById(productId!),
    enabled:  isEdit,
  })

  // Categorías para el selector
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['Categories'],
    queryFn:  getCategories,
  })

  const { data: suppliers = [] } = useQuery({ queryKey: ['Suppliers'], queryFn: getSuppliers })

  // Pre-llenar en modo edición
  useEffect(() => {
    if (existing) {
      setForm(toFormData(existing))
      if (existing.image) setImagePreview(existing.image)
      setImageFile(null)
    }
  }, [existing])

  // Auto-calcular pricePerPiece
  useEffect(() => {
    if (form.piecesPerBox > 0 && form.salePrice > 0) {
      setForm(prev => ({
        ...prev,
        pricePerPiece: parseFloat((prev.salePrice / prev.piecesPerBox).toFixed(2)),
      }))
      setRawNumbers(prev => {
        const next = { ...prev }; delete next.pricePerPiece; return next
      })
    }
  }, [form.salePrice, form.piecesPerBox])


  useEffect(() => {
    if (form.piecesPerBox > 0 && form.weightPerBox > 0) {
      setForm(prev => ({
        ...prev,
        weightPerPiece: parseFloat((prev.weightPerBox / prev.piecesPerBox).toFixed(4)),
      }))
      setRawNumbers(prev => {
        const next = { ...prev }; delete next.weightPerPiece; return next
      })
    }
  }, [form.weightPerBox, form.piecesPerBox])


  const totalCost = parseFloat(((form.cost ?? 0) + (form.freight ?? 0)).toFixed(2))

  // Mutaciones
  const createMut = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Products'] })
      toast.success('Product created')
      navigate('/admin-view-privated/products')
    },
    onError: () => toast.error('Could not create product'),
  })

  const updateMut = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Products'] })
      toast.success('Product updated')
      navigate('/admin-view-privated/products')
    },
    onError: () => toast.error('Could not update product'),
  })

  const isPending = createMut.isPending || updateMut.isPending

  // Handler genérico (campos de texto y selects)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const isNumber = e.target instanceof HTMLInputElement && e.target.type === 'number'
    setForm(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }))
  }

  // Solo dígitos y un separador decimal (se acepta punto o coma).
  const NUMERIC_RE = /^\d*\.?\d*$/

  // Handler para campos numéricos manejados como texto: valida que sea numérico
  // antes de aceptar la tecla y conserva el valor crudo (incl. el punto final).
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target
    let value = e.target.value.replace(',', '.')      // coma decimal → punto
    if (value !== '' && !NUMERIC_RE.test(value)) return // ignora caracteres no numéricos
    value = value.replace(/^0+(?=\d)/, '')            // sin ceros a la izquierda
    setRawNumbers(prev => ({ ...prev, [name]: value }))
    const parsed = value === '' || value === '.' ? 0 : parseFloat(value)
    setForm(prev => ({ ...prev, [name]: Number.isNaN(parsed) ? 0 : parsed }))
  }

  // Valor a mostrar en un campo numérico de texto: el crudo mientras se edita,
  // o el valor del formulario (p. ej. los auto-calculados).
  const numValue = (name: keyof ProductFormData) =>
    rawNumbers[name] !== undefined ? rawNumbers[name] : String(form[name] ?? '')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)                            // guarda el File para el submit
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)                    // solo para el preview visual
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que los campos numéricos sean numéricos válidos (≥ 0) antes de enviar.
    const numericKeys = [
      'stock', 'salePrice', 'promotionalPrice', 'pricePerPiece',
      'promotionalPricePerPiece', 'cost', 'piecesPerBox', 'unitsPerPallet',
      'boxesPerLayer', 'layersPerPallet', 'weightPerBox', 'weightPerPiece', 'freight',
    ] as const
    const invalid = numericKeys.find(k => {
      const n = Number(form[k])
      return !Number.isFinite(n) || n < 0
    })
    if (invalid) {
      toast.error('Please enter valid numeric values')
      return
    }

    const fd = new FormData()

    fd.append('productName',   form.productName)
    fd.append('unitOfMeasure', form.unitOfMeasure)
    if (form.barcode)         fd.append('barcode',         form.barcode)
    if (form.expirationDate)  fd.append('expirationDate',  form.expirationDate)

    if (form.category) fd.append('category', form.category)
    if (form.supplier) fd.append('supplier', form.supplier)
      
    const numberFields = [
      'stock', 'salePrice', 'promotionalPrice', 'pricePerPiece',
      'promotionalPricePerPiece', 'cost', 'piecesPerBox',
      'unitsPerPallet', 'boxesPerLayer', 'layersPerPallet',
      'weightPerBox', 'weightPerPiece', 'freight',
    ] as const
    numberFields.forEach(key => fd.append(key, String(form[key] ?? 0)))
    fd.append('totalCost', String(totalCost))

    // ── Imagen — solo si el usuario seleccionó una nueva ─────────────────
    if (imageFile) fd.append('image', imageFile)

    if (isEdit) updateMut.mutate({ id: productId!, formData: fd })
    else        createMut.mutate(fd)
  }

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-[#5a7a9a] hover:bg-blue-50
                     hover:text-[#185fa5] transition-colors">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">
            {isEdit ? 'Edit Product' : 'New Product'}
          </h1>
          <p className="text-sm text-[#5a7a9a]">
            {isEdit
              ? 'Update the information for this product'
              : 'Fill out the form and add a new product'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── General Information ──────────────────────────────────────── */}
        <FormSection title="General Information">

          <Field label="Product Name" required>
            <input name="productName" type="text" required
              value={form.productName} onChange={handleChange}
              placeholder="Product name" className={input} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Category">
              <select name="category" value={form.category}
                onChange={handleChange} className={input}>
                <option value="">— None —</option>
                {categories.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Unit of Measure">
              <select name="unitOfMeasure" value={form.unitOfMeasure}
                onChange={handleChange} className={input}>
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Barcode">
              <input name="barcode" type="text"
                value={form.barcode} onChange={handleChange}
                placeholder="Optional" className={input} />
            </Field>
            <Field label="Expiration Date">
              <input name="expirationDate" type="date"
                value={form.expirationDate} onChange={handleChange}
                className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Stock" required>
              <input name="stock" type="text" inputMode="numeric" required
                value={numValue('stock')} onChange={handleNumberChange} className={input} />
            </Field>
            <Field label="Supplier">
              <select name='supplier' onChange={handleChange} className={`${input}`} value={form.supplier}>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Imagen */}
          <Field label="Image">
            <div className="flex items-start gap-4">
              {imagePreview ? (
                <div className="relative shrink-0">
                  <img src={imagePreview} alt="Preview"
                    className="w-20 h-20 object-contain rounded-xl border border-gray-200 bg-gray-50" />
                  <button type="button"
                    onClick={() => { setImagePreview('');  setImageFile(null); setForm(p => ({ ...p, image: '' })) }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
                               bg-red-500 text-white text-xs flex items-center justify-center">
                    ×
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 shrink-0 flex flex-col items-center justify-center
                                  border-2 border-dashed border-gray-200 rounded-xl
                                  cursor-pointer hover:border-[#4a7fb5] hover:bg-blue-50 transition-colors">
                  <PhotoIcon className="w-6 h-6 text-gray-400" />
                  <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              )}
              
            </div>
          </Field>
        </FormSection>

        {/* ── Prices ──────────────────────────────────────────────────── */}
        <FormSection title="Prices">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sale Price" required>
              <input name="salePrice" type="text" inputMode="decimal" required
                value={numValue('salePrice')} onChange={handleNumberChange} className={input} />
            </Field>
            <Field label="Promotional Price">
              <input name="promotionalPrice" type="text" inputMode="decimal"
                value={numValue('promotionalPrice')} onChange={handleNumberChange} className={input} />
            </Field>
            <Field label="Price / Piece" hint="auto: price ÷ pieces per box">
              <input name="pricePerPiece" type="text" inputMode="decimal"
                value={numValue('pricePerPiece')}
                onChange={handleNumberChange}
                className={`${input} bg-gray-50 text-gray-400 cursor-default`} />
            </Field>
            <Field label="Promo Price / Piece">
              <input name="promotionalPricePerPiece" type="text" inputMode="decimal"
                value={numValue('promotionalPricePerPiece')} onChange={handleNumberChange} className={input} />
            </Field>
          </div>
          <div className="max-w-xs">
            <Field label="Cost per piece">
              <input name="cost" type="text" inputMode="decimal"
                value={numValue('cost')} onChange={handleNumberChange} className={input} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <Field label="Freight (Flete)">
              <input
                name="freight"
                type="text"
                inputMode="decimal"
                value={numValue('freight')}
                onChange={handleNumberChange}
                placeholder="0.00"
                className={input}
              />
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Landed Cost
                <span className="text-xs font-normal text-[#5a7a9a] ml-1.5">cost + freight</span>
              </label>
              <div className="flex items-center justify-between w-full px-3 py-2.5
                              bg-blue-50 border border-blue-100 rounded-xl">
                <span className="text-xs text-[#5a7a9a] font-medium">
                  ${(form.cost ?? 0).toFixed(2)} + ${(form.freight ?? 0).toFixed(2)}
                </span>
                <span className="font-black text-[#185fa5] text-base">
                  ${totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

        </FormSection>

        {/* ── Pallet Logistics ────────────────────────────────────────── */}
        <FormSection title="Pallet Logistics">
          <div className="max-w-xs">
            <Field label="Pieces per Box">
              <input name="piecesPerBox" type="text" inputMode="numeric"
                value={numValue('piecesPerBox')} onChange={handleNumberChange} className={input} />
            </Field>
          </div>

          {/* Peso — va después de piecesPerBox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <Field label="Weight per Box / Case" hint="(lb)">
              <input
                name="weightPerBox"
                type="text"
                inputMode="decimal"
                value={numValue('weightPerBox')}
                onChange={handleNumberChange}
                placeholder="0.00"
                className={input}
              />
            </Field>
            <Field label="Weight per Piece" hint="auto (editable): box weight ÷ pieces (lb)">
              <input
                name="weightPerPiece"
                type="text"
                inputMode="decimal"
                value={numValue('weightPerPiece')}
                onChange={handleNumberChange}
                placeholder="0.0000"
                className={input}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Units / Pallet">
              <input name="unitsPerPallet" type="text" inputMode="numeric"
                value={numValue('unitsPerPallet')} onChange={handleNumberChange} className={input} />
            </Field>
            <Field label="Boxes / Layer">
              <input name="boxesPerLayer" type="text" inputMode="numeric"
                value={numValue('boxesPerLayer')} onChange={handleNumberChange} className={input} />
            </Field>
            <Field label="Layers / Pallet">
              <input name="layersPerPallet" type="text" inputMode="numeric"
                value={numValue('layersPerPallet')} onChange={handleNumberChange} className={input} />
            </Field>
          </div>
        </FormSection>

        {/* ── Botones ─────────────────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pb-6">
          <button type="button" onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white
                       border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isPending}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600
                       hover:bg-emerald-700 disabled:opacity-60 rounded-xl transition-colors">
            {isPending
              ? (isEdit ? 'Updating...'      : 'Creating...')
              : (isEdit ? 'Update Product'   : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  )
}