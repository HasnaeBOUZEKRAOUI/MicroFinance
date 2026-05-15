import { AlertCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { statutBadge, statutLabel, paginationRange } from '../../utils/helpers'

// ── Spinner ────────────────────────────────────────
export function Spinner({ className = '' }) {
  return <Loader2 className={`animate-spin text-brand-500 ${className}`} size={20} />
}

// ── Empty state ───────────────────────────────────
export function Empty({ message = 'Aucune donnée disponible.' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-surface-800/50 gap-3">
      <AlertCircle size={32} strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
    </div>
  )
}

// ── Error alert ───────────────────────────────────
export function ErrorAlert({ message }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
      <AlertCircle size={16} />
      {message}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────
export function Badge({ statut }) {
  return (
    <span className={`badge ${statutBadge(statut)}`}>
      {statutLabel(statut)}
    </span>
  )
}

// ── Modal ─────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-modal w-full ${widths[size]} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
          <h2 className="font-display font-semibold text-lg text-surface-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors text-surface-800">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────
export function Pagination({ meta, onPageChange }) {
  if (!meta || meta.last_page <= 1) return null
  const pages = paginationRange(meta.current_page, meta.last_page)
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-surface-800/60">
        {meta.from}–{meta.to} sur {meta.total} résultats
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="w-8 text-center text-xs text-surface-800/40">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors ${
                p === meta.current_page
                  ? 'bg-brand-600 text-white'
                  : 'hover:bg-surface-100 text-surface-800'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
          className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-surface-800 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onClose}>Annuler</button>
        <button className="btn-danger" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner className="w-4 h-4" /> : null}
          Confirmer
        </button>
      </div>
    </Modal>
  )
}

// ── Page Header ───────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-surface-900">{title}</h1>
        {subtitle && <p className="text-sm text-surface-800/60 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand:  'bg-brand-50 text-brand-600',
    blue:   'bg-blue-50 text-blue-600',
    amber:  'bg-amber-50 text-amber-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-surface-800/60">{label}</p>
          <p className="font-display font-bold text-2xl text-surface-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-surface-800/50 mt-1">{trend}</p>}
        </div>
        {Icon && (
          <span className={`p-2.5 rounded-xl ${colors[color]}`}>
            <Icon size={20} />
          </span>
        )}
      </div>
    </div>
  )
}