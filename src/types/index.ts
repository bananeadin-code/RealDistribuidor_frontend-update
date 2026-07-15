import { z } from "zod"

/** User Admin */
export const adminSchema = z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string(),
    password: z.string()
})

export const adminDashboardSchema = z.object({
    _id: z.string(),
    name: z.string(),
    email: z.string()
})
export type Admin = z.infer<typeof adminSchema>
export type AdminRegistrationForm = Pick<Admin, 'name' | 'email' | 'password'>
export type AdminLoginForm = Pick<Admin, 'email' | 'password'>

/** Region */

export const RegionSchema = z.object({
  name: z.string(),
  code: z.string(),
  deliveryFee: z.number(),
})

export const DashboardRegionSchema = z.array(z.object({
  _id: z.string(),
  name: z.string(),
  code: z.string(),
  deliveryFee: z.number(),
}))

export const OneRegionSchema = z.object({
  _id: z.string(),
  name: z.string(),
  code: z.string(),
  deliveryFee: z.number(),
})

export type RegionForm = z.infer<typeof RegionSchema>

// ── Catálogo de unidades ──────────────────────────────────────────────────────
export type UnitOfMeasure = 'unit' | 'kg' | 'lb' | 'box' | 'case' | 'pallet'

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  unit: 'Unit', kg: 'Kilogram', lb: 'Pound',
  box: 'Box',   case: 'Case',   pallet: 'Pallet',
}

// ── Entidades relacionadas ────────────────────────────────────────────────────
export type Category = {
  _id:        string
  name:       string
  createdAt?: string
}

// ── Producto (para renderizar — relaciones populadas por el backend) ───────────
export type Product = {
  _id:                       string
  productName:               string
  category?:                 Category | null
  unitOfMeasure:             UnitOfMeasure
  barcode?:                  string
  expirationDate?:           string           // ISO string
  stock:                     number
  supplier?:                 {
    _id: string,
    name: string
  }
  image?:                    string | null
  salePrice:                 number
  promotionalPrice?:         number
  pricePerPiece?:            number
  promotionalPricePerPiece?: number
  cost?:                     number
  piecesPerBox?:             number
  unitsPerPallet?:           number
  boxesPerLayer?:            number
  layersPerPallet?:          number
  weightPerBox:   number
  weightPerPiece: number
  freight:        number
  totalCost:      number
  createdAt?: string
  updatedAt?: string
}

// ── Para el formulario (ObjectId strings en lugar de objetos populados) ────────
export type ProductFormData = {
  productName:               string
  category:                  string           // ObjectId | ''
  unitOfMeasure:             UnitOfMeasure
  barcode:                   string
  expirationDate:            string           // 'YYYY-MM-DD' | ''
  stock:                     number
  supplier:                  string           // ObjectId | ''
  image:                     string           // URL | ''
  salePrice:                 number
  promotionalPrice:          number
  pricePerPiece:             number           // auto-calculado
  promotionalPricePerPiece:  number
  cost:                      number
  piecesPerBox:              number
  unitsPerPallet:            number
  boxesPerLayer:             number
  layersPerPallet:           number
  weightPerBox:   number
  weightPerPiece: number
  freight:        number
  totalCost:      number
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export type Supplier = {
  _id:            string
  name:           string
  email?:         string
  phone?:         string
  contactPerson?: string
  address?:       string
  city?:          string
  paymentTerms?:  string
  notes?:         string
  createdAt?:     string
  updatedAt?:     string
}

export type SupplierFormData = {
  name:          string
  email:         string
  phone:         string
  contactPerson: string
  address:       string
  city:          string
  paymentTerms:  string
  notes:         string
}

// ─── Purchase Order ───────────────────────────────────────────────────────────
export type POStatus = 'pending' | 'sent' | 'received' | 'cancelled'

export type POItem = {
  product:     string
  productName: string
  quantity:    number
  unitPrice:   number
  total:       number
  weightPerPiece: number   
  itemWeight:     number  
}

export type PurchaseOrder = {
  _id:                  string
  supplier:             {
    name: string
    phone: string
    address: string
  }
  items:                POItem[]
  subtotal:             number
  total:                number
  freight?:             number
  totalWeight:          number
  status:               POStatus
  expectedDeliveryDate: string
  receivedAt?:          string
  notes?:               string
  createdAt?:           string
  sentAt?:              string
  updatedAt?:           string
  _emailSent?:          boolean
}

export type POFormData = {
  supplier:             string
  items:                POItem[]
  expectedDeliveryDate: string
  notes:                string
  total:                number
  totalWeight:          number
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'check' | 'other'

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash:     'Cash',
  card:     'Card',
  transfer: 'Transfer',
  check:    'Check',
  other:    'Other',
}

// Payload para crear una venta
export type SaleFormData = {
  customer:      string | null
  items:         SaleItem[]
  subtotal:      number
  total:         number
  paymentMethod: PaymentMethod
  notes:         string
}

// Estado del carrito (solo en el frontend)
export type CartItem = {
  productId:   string
  productName: string
  barcode?:    string
  basePrice:   number   // ← NUEVO: salePrice original del producto
  unitPrice:   number   // basePrice + regionFee (precio real cobrado)
  quantity:    number
  stock:       number
  total:       number
  weightPerPiece?: number
}

// Tickets guardados (localStorage)
export type SavedTicket = {
  id:            string
  customerId:    string | null
  customerName:  string
  items:         CartItem[]
  notes:         string
  paymentMethod: PaymentMethod
  savedAt:       string
}

export type Region = {
  _id:         string
  regionName:  string
  regionCode:  string
  deliveryFee: number 
}

export type RegionFormData = {
  regionName:  string
  regionCode:  string
  deliveryFee: number
}

export type CustomerFormData = {
  name:    string
  phone:   string
  email:   string
  address: string
  notes:   string
  region:  string
}

// ── Sesión de cliente en la tienda ────────────────────────────────────────────
export type ShopCustomer = {
  _id:      string
  name:     string
  email:    string
  phone?:   string
  address?: string
  region?:  Region | null
}

// ── Item en el carrito de la tienda ───────────────────────────────────────────
export type ShopCartItem = {
  _id:          string
  productName:  string
  basePrice:    number          // salePrice real (no mostrar)
  displayPrice: number          // basePrice + regionFee (precio que ve el cliente)
  quantity:     number
  image?:       string | null
  isPromo:      boolean 
  barcode?:     string
  category?:    { _id: string; name: string } | null
  weightPerPiece?: number
}

// ── Customer — agrega accessCode ──────────────────────────────────────────────
// Reemplaza tu tipo Customer existente:
export type Customer = {
  _id:         string
  name:        string
  phone?:      string
  email?:      string
  address?:    string
  notes?:      string
  region?:     Region 
  accessCode?: string
  visitCount?: number
  createdAt?:  string
  updatedAt?:  string
}

// ── OutletContext de la tienda ─────────────────────────────────────────────────
export type ShopOutletContextType = {
  cart:             ShopCartItem[]
  shopCustomer:     ShopCustomer | null
  regionFee:        number
  cartCount:        number
  cartTotal:        number
  isEmpty:          boolean
  addToCart:        (product: Product) => void
  removeFromCart:   (id: string) => void
  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void
  clearCart:        () => void
}

// ── Picker ────────────────────────────────────────────────────────────────────
export type Picker = {
  _id:             string
  name:            string
  accessCode?:     string
  dispatchedCount?: number
  createdAt?:      string
}

export type PickerFormData = { name: string }

export type PickerSession = {
  _id:  string
  name: string
}

// ── SaleItem — agrega campos de surtido ───────────────────────────────────────
export type SaleItem = {
  product:         string
  productName:     string
  barcode?:        string
  quantity:        number
  pickedQuantity?: number | null
  unitPrice:       number
  total:           number
  weightPerPiece?: number
  itemWeight?:     number
}

// ── Sale — agrega source, picker, peso ────────────────────────────────────────
export type SaleStatus = 'pending' | 'fulfilled' | 'completed' | 'refunded' | 'cancelled'

export type Sale = {
  _id:           string
  customer?:     Customer | string | null
  items:         SaleItem[]
  subtotal:      number
  total:         number
  totalWeight?:  number
  paymentMethod: PaymentMethod
  status:        SaleStatus
  notes?:        string
  deliveryExtraAmount?: number
  source?:       'admin' | 'shop'
  picker?:       Picker | string | null
  pickerName?:   string
  pickedAt?:     string
  createdAt?:    string
  updatedAt?:    string
}