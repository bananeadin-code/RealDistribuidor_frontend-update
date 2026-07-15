import { useState }                                         from 'react'
import { useQuery, useMutation, useQueryClient }             from '@tanstack/react-query'
import { Dialog, DialogBackdrop, DialogPanel }               from '@headlessui/react'
import {
  MagnifyingGlassIcon, EyeIcon, XMarkIcon,
  CheckCircleIcon, XCircleIcon, PaperAirplaneIcon,
  ChevronDownIcon, ScaleIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-toastify'

import {
  getPurchaseOrders,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  markAsSentPurchaseOrder,
  cleanupOldPOs,
}                                  from '../../api/PurchaseOrderAPI'
import type { PurchaseOrder, POStatus } from '../../types'
import CleanupOldButton from '../../components/admin/CleanupOldButton'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt$ = (n: number) => `$${n.toFixed(2)}`

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const shortId = (id: string) => id.slice(-6).toUpperCase()

// Maneja supplier null (borrado), string (sin popular) u objeto (populado)
const supplierName = (s: PurchaseOrder['supplier']): string =>
  s && typeof s === 'object' ? (s.name ?? 'Unknown') : (s ? 'Unknown' : 'Deleted supplier')

const LOGO_URL = `${window.location.origin}/logo.jpeg`

function printPO(po: PurchaseOrder) {
  const sId      = shortId(po._id)
  const supplier = po.supplier && typeof po.supplier === 'object' ? po.supplier : null
  const fmtDate  = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

  const rows = po.items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;font-weight:600;">
        ${item.productName}
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">
        ${item.quantity}
      </td>
    </tr>
  `).join('')

  const weightRow = (po.totalWeight ?? 0) > 0 ? `
    <tr>
      <td style="padding:8px 12px;font-size:12px;color:#888;text-align:right;">Est. Total Weight</td>
      <td style="padding:8px 12px;font-size:12px;color:#555;text-align:right;font-weight:600;">${po.totalWeight} lbs</td>
    </tr>
  ` : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Purchase Order #${sId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; max-width: 760px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1a3a5c; }
    .brand-area { display: flex; align-items: center; gap: 14px; }
    .brand-area img { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }
    .brand-text .brand { font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #1a3a5c; }
    .brand-text .brand span { color: #185fa5; }
    .brand-text .address { font-size: 11px; color: #888; margin-top: 6px; line-height: 1.6; }
    .po-meta { text-align: right; }
    .po-meta .label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
    .po-meta .value { font-weight: 900; font-size: 20px; color: #1a3a5c; margin-top: 2px; }
    .po-meta .date  { font-size: 12px; color: #555; margin-top: 8px; font-weight: 600; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8f9fb; border-radius: 10px; padding: 16px 20px; margin: 20px 0; }
    .info-block .lbl { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-block .val { font-weight: 700; font-size: 14px; margin-top: 3px; color: #1a1a1a; }
    .info-block .sub { font-size: 12px; color: #666; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #1a3a5c; }
    th { padding: 10px 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: white; }
    th:not(:first-child) { text-align: right; }
    .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 32px; padding-top: 20px; border-top: 1px solid #eee; }
    @media print { body { padding: 16px; } @page { margin: 12mm; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-area">
      <img src="${LOGO_URL}" alt="Real Distribuidor" />
      <div class="brand-text">
        <div class="brand"><span>REAL</span> DISTRIBUIDOR</div>
        <div class="address">5701 Ogden Ave, Cicero, IL 60804<br>TEL: (630)-215-6252</div>
      </div>
    </div>
    <div class="po-meta">
      <div class="label">Purchase Order #</div>
      <div class="value">${sId}</div>
      <div class="date">Issued: ${fmtDate(po.createdAt)}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-block">
      <div class="lbl">Supplier</div>
      <div class="val">${supplier?.name ?? 'Deleted supplier'}</div>
      ${supplier?.phone ? `<div class="sub">${supplier.phone}</div>` : ''}
      ${supplier?.address ? `<div class="sub">${supplier.address}</div>` : ''}
    </div>
    <div class="info-block">
      <div class="lbl">Expected Delivery</div>
      <div class="val" style="font-size:13px">${fmtDate(po.expectedDeliveryDate)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left">Product</th>
        <th style="text-align:right">Qty</th>
      </tr>
    </thead>
    <tbody>${rows}${weightRow}</tbody>
  </table>

  ${po.notes ? `<div style="background:#f8f9fb;border-left:4px solid #185fa5;padding:12px 16px;border-radius:0 8px 8px 0;margin-top:20px;font-size:13px;color:#555;"><strong>Notes:</strong> ${po.notes}</div>` : ''}

  <div class="footer">Real Distribuidor · 5701 Ogden Ave, Cicero, IL 60804 · (630)-215-6252</div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`

  const w = window.open('', '_blank', 'width=820,height=700')
  if (w) { w.document.write(html); w.document.close() }
}

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<POStatus, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50  text-amber-600  border-amber-200'  },
  sent:      { label: 'Sent',      cls: 'bg-blue-50   text-blue-600   border-blue-200'   },
  received:  { label: 'Received',  cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50    text-red-500    border-red-200'    },
}

function StatusBadge({ status }: { status: POStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs
                      font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ─── PODetailModal ─────────────────────────────────────────────────────────────
function PODetailModal({
  po,
  onClose,
  onUpdate,
}: {
  po:      PurchaseOrder | null
  onClose: () => void
  onUpdate: (updatedPO: PurchaseOrder) => void
}) {
  const queryClient = useQueryClient()

  const [receiving, setReceiving] = useState(false)
  const [received,  setReceived]  = useState<Record<string, number>>({})
  const [freight,   setFreight]   = useState(0)

  const startReceiving = () => {
    if (!po) return
    const map: Record<string, number> = {}
    po.items.forEach(i => { map[i.product] = i.quantity })
    setReceived(map)
    setFreight(0)
    setReceiving(true)
  }

  const receivedItemsTotal = po
    ? po.items.reduce((s, i) => s + (received[i.product] ?? i.quantity) * i.unitPrice, 0)
    : 0

  const receiveMut = useMutation({
    mutationFn: receivePurchaseOrder,
    onSuccess: (updatedPO) => {
      queryClient.invalidateQueries({ queryKey: ['PurchaseOrders'] })
      onUpdate(updatedPO)
      setReceiving(false)
      toast.success('PO received — stock updated with real quantities')
    },
    onError: () => toast.error('Could not receive PO'),
  })

  const handleReceive = () => {
    if (!po) return
    receiveMut.mutate({
      id:    po._id,
      items: po.items.map(i => ({
        product:          i.product,
        receivedQuantity: received[i.product] ?? 0,
      })),
      freight,
    })
  }

  const sentMut = useMutation({
    mutationFn: markAsSentPurchaseOrder,
    onSuccess: (updatedPO) => {
      queryClient.invalidateQueries({ queryKey: ['PurchaseOrders'] })
      onUpdate(updatedPO)
      toast.success(
        updatedPO._emailSent
          ? 'PO sent and email delivered to supplier'
          : 'PO marked as sent — no email on file for this supplier'
      )
    },
    onError: () => toast.error('Could not send PO'),
  })

  const cancelMut = useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: (updatedPO) => {
      queryClient.invalidateQueries({ queryKey: ['PurchaseOrders'] })
      onUpdate(updatedPO)
      toast.success('PO cancelled')
    },
    onError: () => toast.error('Could not cancel PO'),
  })

  const isPending = sentMut.isPending || receiveMut.isPending || cancelMut.isPending

  return (
    <Dialog open={!!po} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 backdrop-blur-sm
                   transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl
                     shadow-2xl flex flex-col max-h-[90vh]
                     transition-all duration-300
                     data-closed:translate-y-full sm:data-closed:translate-y-0
                     sm:data-closed:scale-95 sm:data-closed:opacity-0"
        >
          {po && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4
                              border-b border-gray-100 shrink-0">
                <div>
                  <p className="font-black text-[#1a3a5c] text-lg">
                    PO #{shortId(po._id)}
                  </p>
                  <p className="text-xs text-[#5a7a9a]">
                    Created {fmtDate(po.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => printPO(po)}
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

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Supplier</p>
                    <p className="font-bold text-gray-800 uppercase text-sm">
                      {supplierName(po.supplier)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Status</p>
                    <StatusBadge status={po.status} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Order Date</p>
                    <p className="font-semibold text-gray-700 text-sm">
                      {fmtDate(po.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Expected Delivery</p>
                    <p className="font-semibold text-gray-700 text-sm">
                      {fmtDate(po.expectedDeliveryDate)}
                    </p>
                  </div>
                  {po.status === 'received' && po.receivedAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400 mb-0.5">Received On</p>
                      <p className="font-semibold text-emerald-600 text-sm">
                        {fmtDate(po.receivedAt)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tabla de items */}
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2.5 text-left text-xs font-semibold
                                       text-gray-500 uppercase tracking-wide">Item</th>
                        <th className="px-3 py-2.5 text-center text-xs font-semibold
                                       text-gray-500 uppercase tracking-wide">Qty</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold
                                       text-gray-500 uppercase tracking-wide">Unit cost</th>
                        <th className="px-3 py-2.5 text-right text-xs font-semibold
                                       text-gray-500 uppercase tracking-wide">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {po.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-3">
                            <p className="font-semibold text-gray-800 uppercase text-xs leading-snug">
                              {item.productName}
                            </p>
                            {(item.itemWeight ?? 0) > 0 && (
                              <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                                <ScaleIcon className="w-3 h-3" />
                                {item.itemWeight} lbs
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600 font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-600">
                            {fmt$(item.unitPrice)}
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-gray-800">
                            {fmt$(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totales */}
                <div className="space-y-2">
                  {(po.totalWeight ?? 0) > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5
                                    bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-[#5a7a9a] font-medium flex items-center gap-1.5">
                        <ScaleIcon className="w-4 h-4" />
                        Total Weight
                      </p>
                      <p className="font-bold text-gray-700 text-sm">{po.totalWeight} lbs</p>
                    </div>
                  )}
                  {(po.freight ?? 0) > 0 && (
                    <div className="flex items-center justify-between px-4 py-2.5
                                    bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-[#5a7a9a] font-medium">Freight</p>
                      <p className="font-bold text-gray-700 text-sm">{fmt$(po.freight ?? 0)}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3
                                  bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-[#1a3a5c] text-sm">Total</p>
                    <p className="font-black text-[#185fa5] text-xl">{fmt$(po.total)}</p>
                  </div>
                </div>

                {/* Notes */}
                {po.notes && (
                  <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Notes</p>
                    <p className="leading-relaxed">{po.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer con acciones de status */}
              <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                {po.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => sentMut.mutate(po._id)}
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5
                                 py-2.5 text-sm font-semibold text-white bg-[#185fa5]
                                 hover:bg-[#0c447c] disabled:opacity-50 rounded-xl transition-colors"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      {sentMut.isPending ? 'Sending...' : 'Mark as Sent'}
                    </button>
                    <button
                      onClick={() => cancelMut.mutate(po._id)}
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5
                                 py-2.5 text-sm font-semibold text-red-500
                                 bg-red-50 hover:bg-red-100 border border-red-200
                                 disabled:opacity-50 rounded-xl transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Cancel PO
                    </button>
                  </div>
                )}
                {po.status === 'sent' && (
                  <div className="flex gap-2">
                    <button onClick={startReceiving} disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5
                                 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700
                                 disabled:opacity-50 rounded-xl transition-colors">
                      <CheckCircleIcon className="w-4 h-4" /> Receive
                    </button>
                    <button
                      onClick={() => cancelMut.mutate(po._id)}
                      disabled={isPending}
                      className="flex-1 inline-flex items-center justify-center gap-1.5
                                 py-2.5 text-sm font-semibold text-red-500
                                 bg-red-50 hover:bg-red-100 border border-red-200
                                 disabled:opacity-50 rounded-xl transition-colors"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Cancel PO
                    </button>
                  </div>
                )}
                {(po.status === 'received' || po.status === 'cancelled') && (
                  <button onClick={onClose}
                    className="w-full py-2.5 text-sm font-medium text-gray-600
                               bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    Close
                  </button>
                )}
              </div>
            </>
          )}

          {/* Sub-modal: confirmar cantidades recibidas */}
          <Dialog open={receiving} onClose={() => setReceiving(false)} className="relative z-60">
            <DialogBackdrop transition
              className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 data-closed:opacity-0" />
            <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <DialogPanel transition
                className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl
                           flex flex-col max-h-[88vh] transition-all duration-300
                           data-closed:translate-y-full sm:data-closed:translate-y-0
                           sm:data-closed:scale-95 sm:data-closed:opacity-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                  <div>
                    <p className="font-bold text-[#1a3a5c] text-lg">Confirm Received</p>
                    <p className="text-xs text-[#5a7a9a]">Adjust quantities if not everything arrived</p>
                  </div>
                  <button onClick={() => setReceiving(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-3">
                  {po?.items.map(item => {
                    const ordered = item.quantity
                    const current = received[item.product] ?? ordered
                    const complete = current === ordered
                    return (
                      <div key={item.product} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="font-semibold text-gray-800 text-sm flex-1">{item.productName}</p>
                          {complete && <CheckCircleIcon className="w-5 h-5 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Ordered: <strong>{ordered}</strong></span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-500">Received:</label>
                            <input type="number" min={0} max={ordered} value={current}
                              onChange={e => {
                                const v = Math.max(0, Math.min(ordered, parseInt(e.target.value) || 0))
                                setReceived(prev => ({ ...prev, [item.product]: v }))
                              }}
                              className={`w-16 text-center text-sm font-bold rounded-lg py-1.5 border
                                          focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]
                                          ${complete ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : current === 0 ? 'border-red-200 bg-red-50 text-red-600'
                                            : 'border-amber-200 bg-amber-50 text-amber-700'}`} />
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {/* Freight de la orden — varía por proveedor, se suma al total al recibir */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-medium text-gray-700">Freight</label>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">$</span>
                        <input
                          type="number" min={0} step="0.01" value={freight}
                          onChange={e => setFreight(parseFloat(e.target.value) || 0)}
                          className="w-24 text-right text-sm font-bold rounded-lg py-1.5 px-2 border
                                     border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#4a7fb5]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 py-3
                                  bg-blue-50 rounded-xl border border-blue-100">
                    <p className="font-semibold text-[#1a3a5c] text-sm">New Total</p>
                    <p className="font-black text-[#185fa5] text-lg">
                      {fmt$(receivedItemsTotal + freight)}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 shrink-0">
                  <button onClick={handleReceive} disabled={receiveMut.isPending}
                    className="w-full py-3 text-sm font-semibold text-white bg-emerald-600
                               hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-colors">
                    {receiveMut.isPending ? 'Confirming...' : 'Confirm & Add to Stock'}
                  </button>
                </div>
              </DialogPanel>
            </div>
          </Dialog>

        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ─── POCard (mobile) ───────────────────────────────────────────────────────────
function POCard({
  po, onView,
}: {
  po:     PurchaseOrder
  onView: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-400 font-medium">PO #{shortId(po._id)}</p>
            <p className="font-bold text-[#1a3a5c] text-base uppercase mt-0.5">
              {supplierName(po.supplier)}
            </p>
          </div>
          <StatusBadge status={po.status} />
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Order Date</p>
            <p className="font-medium text-gray-700 text-xs">{fmtDate(po.createdAt)}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Exp. Delivery</p>
            <p className="font-medium text-gray-700 text-xs">{fmtDate(po.expectedDeliveryDate)}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-medium">Items</p>
              <p className="font-medium text-gray-700 text-xs">{po.items.length}</p>
            </div>
            {(po.totalWeight ?? 0) > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-medium">Total Weight</p>
                <p className="font-medium text-gray-700 text-xs">{po.totalWeight} lbs</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex border-t border-gray-100">
        <div className="flex-1 px-4 py-3 flex items-center">
          <p className="font-black text-[#185fa5] text-lg">{fmt$(po.total)}</p>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="px-3 py-3 text-gray-400 hover:text-gray-600
                     hover:bg-gray-50 transition-colors border-l border-gray-100"
          title={expanded ? 'Show less' : 'Show more'}
        >
          <ChevronDownIcon
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          onClick={onView}
          className="px-3 py-3 text-[#5a7a9a] hover:text-[#185fa5]
                     hover:bg-blue-50 transition-colors border-l border-gray-100"
          title="View details"
        >
          <EyeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Vista principal ───────────────────────────────────────────────────────────
export default function PurchaseOrdersView() {
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState<POStatus | 'all'>('all')
  const [detailPO,  setDetailPO]  = useState<PurchaseOrder | null>(null)

  const { data: orders = [], isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['PurchaseOrders'],
    queryFn:  getPurchaseOrders,
  })

  const filtered = orders.filter(po => {
    const matchSearch = supplierName(po.supplier)
      .toLowerCase().includes(search.toLowerCase())
    const matchStatus = status === 'all' || po.status === status
    return matchSearch && matchStatus
  })

  // Ordena: pendientes primero, luego sent, luego por fecha desc
  const sorted = [...filtered].sort((a, b) => {
    const order = { pending: 0, sent: 1, received: 2, cancelled: 3 }
    const diff  = (order[a.status] ?? 4) - (order[b.status] ?? 4)
    if (diff !== 0) return diff
    return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  })

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <p className="text-[#5a7a9a] animate-pulse text-sm">Loading purchase orders...</p>
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#1a3a5c]">Purchase Orders</h1>
          <p className="text-sm text-[#5a7a9a] mt-0.5">
            {orders.length} total {orders.length === 1 ? 'order' : 'orders'}
          </p>
        </div>
        <CleanupOldButton mutationFn={cleanupOldPOs} queryKey="PurchaseOrders" />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a7a9a]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by supplier..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea]
                       bg-white text-[#2c4a6e] placeholder-[#8aaac8] shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-[#4a7fb5] focus:border-transparent"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as POStatus | 'all')}
          className="px-4 py-2.5 text-sm rounded-xl border border-[#c8d8ea] bg-white
                     text-[#2c4a6e] shadow-sm focus:outline-none focus:ring-2
                     focus:ring-[#4a7fb5] focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* ── MOBILE: Cards ────────────────────────────────────────────── */}
      <div className="sm:hidden space-y-3">
        {sorted.length === 0 ? (
          <p className="text-center py-14 text-gray-400 text-sm">No purchase orders found</p>
        ) : sorted.map(po => (
          <POCard key={po._id} po={po} onView={() => setDetailPO(po)} />
        ))}
      </div>

      {/* ── DESKTOP: Tabla ───────────────────────────────────────────── */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm
                      border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-175">
            <thead>
              <tr className="bg-[#1a3a5c] text-white text-xs uppercase tracking-wide">
                {['PO #', 'Supplier', 'Order Date', 'Exp. Delivery',
                  'Items', 'Weight', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3 font-semibold
                    ${['Total', 'Items', 'Weight'].includes(h) ? 'text-right' : 'text-left'}
                    ${'Actions'.includes(h) ? 'text-center' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-gray-400 text-sm">
                    No purchase orders found
                  </td>
                </tr>
              ) : sorted.map(po => (
                <tr key={po._id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-gray-500">
                    {shortId(po._id)}
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800 uppercase text-xs">
                    {supplierName(po.supplier)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtDate(po.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtDate(po.expectedDeliveryDate)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {po.items.length}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">
                    {(po.totalWeight ?? 0) > 0 ? `${po.totalWeight} lbs` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {fmt$(po.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={po.status} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => setDetailPO(po)} title="View details"
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

      {/* Detail modal */}
      <PODetailModal po={detailPO} onClose={() => setDetailPO(null)} onUpdate={(updatedPO) => setDetailPO(updatedPO)} />

    </div>
  )
}