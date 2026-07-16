import { useQuery } from '@tanstack/react-query'
import { getCustomers } from '../../api/CustomerAPI'
import type { Customer } from '../../types'
import SaleBuilder from '../../components/sales/SaleBuilder'

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function NewSaleView() {
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['Customers'],
    queryFn:  getCustomers,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#1a3a5c]">New Sale</h1>
        <p className="text-sm text-[#5a7a9a] mt-0.5">Add products to cart and complete the sale</p>
      </div>

      <SaleBuilder customers={customers} showStock />
    </div>
  )
}
