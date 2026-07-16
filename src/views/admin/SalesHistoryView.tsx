import { useState, useEffect }                               from 'react'
import { useQuery, useMutation, useQueryClient }              from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }                from '@headlessui/react'
import {
  MagnifyingGlassIcon, EyeIcon, XMarkIcon,
  PrinterIcon, ChevronDownIcon,
  ArrowUturnLeftIcon, XCircleIcon,
  CheckCircleIcon,
  ScaleIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { CreditCardIcon } from '@heroicons/react/24/solid'
import { toast }                                             from 'react-toastify'

import { getSales, updateSaleStatus, updateSaleNotes }   from '../../api/SaleAPI'
import type { Sale, SaleStatus, PaymentMethod } from '../../types'
import CleanupOldButton from '../../components/admin/CleanupOldButton'
import { cleanupOldSales } from '../../api/SaleAPI'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (n: number) => `$${n.toFixed(2)}`

const fmtDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—'

const fmtDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${fmtDate(iso)} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

const shortId = (id: string) => id.slice(-6).toUpperCase()

const LOGO_URL = `${window.location.origin}/logo.jpeg`

const customerLabel = (c: Sale['customer']) =>
  c && typeof c === 'object' ? c.name : 'Walk-in Customer'

const pmLabel: Record<PaymentMethod, string> = {
  cash: 'Cash', card: 'Card', transfer: 'Transfer', check: 'Check', other: 'Other',
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<SaleStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50  text-amber-600  border-amber-200'      },
  fulfilled: { label: 'Fulfilled', cls: 'bg-purple-50 text-purple-600 border-purple-200'    },
  completed: { label: 'Completed', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  refunded:  { label: 'Refunded',  cls: 'bg-blue-50   text-blue-600   border-blue-200'     },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50    text-red-500    border-red-200'      },
}

function StatusBadge({ status }: { status: SaleStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.completed
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                       border capitalize ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── Invoice print ─────────────────────────────────────────────────────────────
function printInvoice(sale: Sale) {
  const sId     = shortId(sale._id)
  const cName   = customerLabel(sale.customer)
  const dateStr = fmtDateTime(sale.createdAt)
  const payment = pmLabel[sale.paymentMethod] ?? sale.paymentMethod
  const rows    = sale.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;">
        ${item.productName}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#888;">
        ${item.barcode || '—'}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;">
        ${item.pickedQuantity ?? item.quantity}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">
        $${item.unitPrice.toFixed(2)}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;font-weight:bold;">
        $${item.total.toFixed(2)}
      </td>
    </tr>
  `).join('')

  const statusColor = sale.status === 'completed'
    ? '#059669' : sale.status === 'refunded'
    ? '#2563eb' : sale.status === 'fulfilled'
    ? '#9333ea' : '#dc2626'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${sId} — Real Distribuidor</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; max-width: 760px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .logo-area { display: flex; align-items: center; gap: 12px; }
    .logo-area img { width: 56px; height: 56px; object-fit: contain; border-radius: 6px; }
    .company-text .company { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .company-text .company span { color: #059669; }
    .company-text .address { font-size: 11px; color: #888; margin-top: 4px; line-height: 1.5; }
    .invoice-meta { text-align: right; }
    .invoice-meta .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .invoice-meta .value { font-weight: 800; font-size: 18px; margin-top: 1px; }
    .invoice-meta .date  { font-size: 12px; font-weight: 600; color: #333; margin-top: 6px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; 
                 background: #f9f9f9; padding: 16px 20px; border-radius: 10px; margin: 20px 0; }
    .info-label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-value { font-weight: 700; font-size: 14px; margin-top: 3px; }
    .status-chip { display: inline-block; padding: 3px 12px; border-radius: 20px; 
                   font-size: 12px; font-weight: 700; background: ${statusColor}22; 
                   color: ${statusColor}; border: 1px solid ${statusColor}44; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f3f4f6; }
    th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700;
         text-transform: uppercase; letter-spacing: 0.5px; color: #666; }
    th:not(:first-child) { text-align: right; }
    th:nth-child(3) { text-align: center; }
    .total-section { display: flex; justify-content: flex-end; padding: 16px 12px 0; }
    .total-label { font-size: 13px; color: #666; margin-right: 32px; }
    .total-value { font-size: 26px; font-weight: 900; color: #1a1a1a; }
    .footer { text-align: center; font-size: 12px; color: #888; 
              margin-top: 28px; padding-top: 20px; border-top: 1px solid #eee; line-height: 1.6; }
    .terms { font-size: 11px; color: #bbb; margin-top: 6px; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <img src="${LOGO_URL}" alt="Real Distribuidor" />
      <div class="company-text">
        <div class="company"><span>REAL</span> DISTRIBUIDOR</div>
        <div class="address">5701 Ogden Ave, Cicero, IL 60804<br>(630)-215-6252</div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="label">Invoice #</div>
      <div class="value">${sId}</div>
      <div class="date">${dateStr}</div>
    </div>
  </div>

  <div class="info-grid">
    <div>
      <div class="info-label">Customer</div>
      <div class="info-value">${cName}</div>
    </div>
    <div>
      <div class="info-label">Payment</div>
      <div class="info-value">${payment}</div>
    </div>
    <div>
      <div class="info-label">Status</div>
      <div class="info-value"><span class="status-chip">${STATUS_CFG[sale.status]?.label ?? sale.status}</span></div>
    </div>
    ${sale.notes ? `<div><div class="info-label">Notes</div><div class="info-value" style="font-weight:400;font-size:13px;">${sale.notes}</div></div>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align:right">Barcode</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${(sale.totalWeight ?? 0) > 0 ? `
  <div style="display:flex;justify-content:flex-end;align-items:center;gap:32px;padding:8px 12px;">
    <span style="font-size:13px;color:#888;">Total Weight</span>
    <span style="font-size:14px;font-weight:600;color:#555;">${sale.totalWeight} lbs</span>
  </div>
` : ''}

  ${(sale.deliveryExtraAmount ?? 0) > 0 ? `
  <div style="display:flex;justify-content:flex-end;align-items:center;gap:32px;padding:8px 12px;">
    <span style="font-size:13px;color:#888;">Delivery Extra</span>
    <span style="font-size:14px;font-weight:600;color:#555;">$${(sale.deliveryExtraAmount ?? 0).toFixed(2)}</span>
  </div>
` : ''}

  <div class="total-section">
    <span class="total-label">Total Amount</span>
    <span class="total-value">$${sale.total.toFixed(2)}</span>
  </div>

  <div class="footer">
    Thank you for your purchase! · REAL DISTRIBUIDOR
    <div class="terms">
      <strong>TÉRMINOS Y CONDICIONES:</strong> Price subject to change without notice.
    </div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=820,height=700')
  if (w) { w.document.write(html); w.document.close() }
}

// ─── SaleCard (mobile) ─────────────────────────────────────────────────────────
function SaleCard({
  sale, onView,
}: {
  sale:   Sale
  onView: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs text-gray-400 font-mono">#{shortId(sale._id)}</p>
            <p className="font-bold text-[#1a3a5c] text-sm mt-0.5">
              {customerLabel(sale.customer)}
            </p>
          </div>
          <StatusBadge status={sale.status} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div>
            <span className="text-gray-400">Date  </span>
            <span className="font-medium text-gray-700">{fmtDate(sale.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-400">Items  </span>
            <span className="font-medium text-gray-700">{sale.items.length}</span>
          </div>
        </div>
        {expanded && (
          <div className="mt-2 pt-2 border-t border-gray-50 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div>
              <span className="text-gray-400">Payment  </span>
              <span className="font-medium text-gray-700 capitalize">
                {pmLabel[sale.paymentMethod]}
              </span>
            </div>
            {sale.notes && (
              <div className="col-span-2">
                <span className="text-gray-400">Note  </span>
                <span className="font-medium text-gray-700">{sale.notes}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex border-t border-gray-100">
        <div className="flex-1 px-4 py-3 flex items-center">
          <p className="font-black text-[#185fa5] text-lg">{fmt$(sale.total)}</p>
        </div>
        <button onClick={() => setExpanded(e => !e)}
          className="px-3 py-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50
                     transition-colors border-l border-gray-100">
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        <button onClick={onView}
          className="px-3 py-3 text-[#5a7a9a] hover:text-[#185fa5] hover:bg-blue-50
                     transition-colors border-l border-gray-100" title="View details">
          <EyeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── SaleDetailModal ───────────────────────────────────────────────────────────
function SaleDetailModal({
  sale, onClose,
}: {
  sale:    Sale | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const statusMut = useMutation({
    mutationFn: updateSaleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Orders'] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Could not update status'),
  })

  const [noteDraft, setNoteDraft] = useState('')
  const [extraDraft, setExtraDraft] = useState('')
  useEffect(() => {
    setNoteDraft(sale?.notes ?? '')
    setExtraDraft(sale?.deliveryExtraAmount ? String(sale.deliveryExtraAmount) : '')
  }, [sale?._id])

  const notesMut = useMutation({
    mutationFn: updateSaleNotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['Orders'] })
      toast.success('Note saved')
    },
    onError: () => toast.error('Could not save note'),
  })

  const noteDirty =
    noteDraft !== (sale?.notes ?? '') ||
    extraDraft !== (sale?.deliveryExtraAmount ? String(sale.deliveryExtraAmount) : '')

  const saveDeliveryInfo = () => {
    if (!sale) return
    notesMut.mutate({ id: sale._id, notes: noteDraft, deliveryExtraAmount: parseFloat(extraDraft) || 0 })
  }

  return (
    <Dialog open={!!sale} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl
                     shadow-2xl flex flex-col max-h-[92vh]
                     transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:dataclosed:scale-95 sm:data-closed:opacity-0"
        >
          {sale && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4
                              border-b border-gray-100 shrink-0">
                <div>
                  <p className="font-black text-[#1a3a5c] text-lg">
                    Invoice #{shortId(sale._id)}
                  </p>
                  <p className="text-xs text-[#5a7a9a] mt-0.5">{fmtDateTime(sale.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printInvoice(sale)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold
                               text-[#185fa5] bg-blue-50 hover:bg-blue-100 border border-blue-200
                               rounded-xl transition-colors"
                  >
                    <PrinterIcon className="w-4 h-4" /> Print / PDF
                  </button>
                  <button onClick={onClose}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600
                               hover:bg-gray-100 transition-colors">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-5">

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                  <div>
                    <p className="text-xs text-gray-400">Customer</p>
                    <p className="font-bold text-gray-800 text-sm mt-0.5">
                      {customerLabel(sale.customer)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <div className="mt-0.5"><StatusBadge status={sale.status} /></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Payment</p>
                    <p className="font-semibold text-gray-700 text-sm mt-0.5 capitalize flex items-center gap-1">
                      <CreditCardIcon className="w-3.5 h-3.5 text-gray-400" />
                      {pmLabel[sale.paymentMethod]}
                    </p>
                  </div>
                  {sale.pickerName && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Fulfilled by</p>
                      <p className="font-semibold text-emerald-600 text-sm flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {sale.pickerName}
                      </p>
                    </div>
                  )}
                  {sale.source === 'seller' && sale.sellerName && (
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Seller</p>
                      <p className="font-semibold text-indigo-600 text-sm flex items-center gap-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        {sale.sellerName}
                      </p>
                    </div>
                  )}
                </div>

                {/* Delivery / Notes — editable en cualquier status */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-gray-400">Delivery / Notes</p>
                  <textarea
                    value={noteDraft}
                    onChange={e => setNoteDraft(e.target.value)}
                    placeholder="Add delivery instructions or notes for this order..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white
                               text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2
                               focus:ring-[#4a7fb5] focus:border-transparent transition resize-none"
                  />

                  {sale.status === 'fulfilled' ? (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <label className="text-xs text-gray-500 shrink-0">
                        Delivery Extra Amount <span className="text-gray-400">(optional)</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number" min={0} step="0.01"
                          value={extraDraft}
                          onChange={e => setExtraDraft(e.target.value)}
                          placeholder="0.00"
                          className="w-24 text-right text-sm font-semibold rounded-lg py-1.5 px-2 border
                                     border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
                        />
                      </div>
                    </div>
                  ) : (sale.deliveryExtraAmount ?? 0) > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-gray-500">Delivery Extra Amount</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {fmt$(sale.deliveryExtraAmount ?? 0)}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={saveDeliveryInfo}
                      disabled={notesMut.isPending || !noteDirty}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                 text-white bg-[#185fa5] hover:bg-[#0c447c] disabled:opacity-40
                                 rounded-lg transition-colors"
                    >
                      {notesMut.isPending ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                {/* Items table */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Item', 'Barcode', 'Qty', 'Price', 'Total'].map(h => (
                          <th key={h}
                            className={`px-3 py-2.5 text-xs font-semibold text-gray-500
                                         uppercase tracking-wide
                                         ${['Qty','Price','Total'].includes(h) ? 'text-right' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sale.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-3 font-semibold text-gray-800 text-xs uppercase leading-snug">
                            {item.productName}
                          </td>
                          <td className="px-3 py-3 text-xs text-gray-400">
                            {item.barcode || '—'}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 text-xs">
                            {item.pickedQuantity ?? item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600 text-xs">
                            {fmt$(item.unitPrice)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-gray-800 text-xs">
                            {fmt$(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(sale.totalWeight ?? 0) > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5
                                  bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-sm text-[#5a7a9a] font-medium flex items-center gap-1.5">
                      <ScaleIcon className="w-4 h-4" />
                      Total Weight
                    </p>
                    <p className="font-bold text-gray-700 text-sm">{sale.totalWeight} lbs</p>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between px-4 py-3
                                bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-semibold text-[#1a3a5c] text-sm">Total Amount</p>
                  <p className="font-black text-[#185fa5] text-2xl">{fmt$(sale.total)}</p>
                </div>
              </div>

              {/* Footer — cambio de status */}
              <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                {sale.status === 'fulfilled' && (
                  <button
                    onClick={() => statusMut.mutate({ id: sale._id, status: 'completed' })}
                    disabled={statusMut.isPending}
                    className="w-full inline-flex items-center justify-center gap-1.5
                               py-2.5 text-sm font-semibold text-white bg-emerald-600
                               hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {statusMut.isPending ? 'Updating...' : 'Mark as Completed'}
                  </button>
                )}
                {sale.status === 'completed' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => statusMut.mutate({ id: sale._id, status: 'refunded' })}
                      disabled={statusMut.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5
                                 py-2.5 text-sm font-semibold text-blue-600
                                 bg-blue-50 hover:bg-blue-100 border border-blue-200
                                 disabled:opacity-50 rounded-xl transition-colors"
                    >
                      <ArrowUturnLeftIcon className="w-4 h-4" />
                      Refund
                    </button>
                    <button
                      onClick={() => statusMut.mutate({ id: sale._id, status: 'cancelled' })}
                      disabled={statusMut.isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5
                                 py-2.5 text-sm font-semibold text-red-500
                                 bg-red-50 hover:bg-red-100 border border-red-200
                                 disabled:opacity-50 rounded-xl transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                )}
                {(sale.status === 'refunded' || sale.status === 'cancelled') && (
                  <button onClick={onClose}
                    className="w-full py-2.5 text-sm font-medium text-gray-600 bg-gray-100
                               hover:bg-gray-200 rounded-xl transition-colors">
                    Close
                  </button>
                )}
                {sale.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => statusMut.mutate({ id: sale._id, status: 'completed' })}
                    disabled={statusMut.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5
                               py-2.5 text-sm font-semibold text-white bg-emerald-600
                               hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    {statusMut.isPending ? 'Updating...' : 'Mark as Completed'}
                  </button>
                  <button
                    onClick={() => statusMut.mutate({ id: sale._id, status: 'cancelled' })}
                    disabled={statusMut.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1.5
                               py-2.5 text-sm font-semibold text-red-500
                               bg-red-50 hover:bg-red-100 border border-red-200
                               disabled:opacity-50 rounded-xl transition-colors"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
)}
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function SalesHistoryView() {
  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState<SaleStatus | 'all'>('all')
  const [detailSaleId, setDetailSaleId] = useState<string | null>(null)

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ['Orders'],
    queryFn:  getSales,
  })

  // Derivado (no una copia) para que se refresque solo tras editar la nota
  const detailSale = sales.find(s => s._id === detailSaleId) ?? null

  const filtered = sales.filter(s => {
    const matchSearch = customerLabel(s.customer).toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'all' || s.status === status
    return matchSearch && matchStatus
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading sales...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">Sales History</h1>
          <p className="text-sm text-[#5a7a9a] mt-0.5">{sales.length} total transactions</p>
        </div>
          <CleanupOldButton mutationFn={cleanupOldSales} queryKey="Orders" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                       bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as SaleStatus | 'all')}
          className="px-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea] bg-white
                     text-[#2c4a6e] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="completed">Completed</option>
          <option value="refunded">Refunded</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Mobile: cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No sales found</p>
        ) : filtered.map(sale => (
          <SaleCard key={sale._id} sale={sale} onView={() => setDetailSaleId(sale._id)} />
        ))}
      </div>

      {/* Desktop: tabla */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm
                      border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-170">
            <thead>
              <tr className="bg-[#1a3a5c] text-white text-xs uppercase tracking-wide">
                {['Date', 'Customer', 'Items', 'Payment', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h}
                    className={`px-4 py-3 font-semibold text-left
                      ${'Total'.includes(h) ? 'text-right' : ''}
                      ${'Actions'.includes(h) ? 'text-center' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-14 text-gray-400 text-sm">
                    No sales found
                  </td>
                </tr>
              ) : filtered.map(sale => (
                <tr key={sale._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDateTime(sale.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {customerLabel(sale.customer)}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{sale.items.length}</td>
                  <td className="px-4 py-3 text-gray-500 capitalize">
                    {pmLabel[sale.paymentMethod]}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {fmt$(sale.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={sale.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setDetailSaleId(sale._id)} title="View & print"
                      className="p-1.5 text-[#5a7a9a] hover:text-[#185fa5]
                                 hover:bg-blue-50 rounded-lg transition-colors">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SaleDetailModal sale={detailSale} onClose={() => setDetailSaleId(null)} />
    </div>
  )
}