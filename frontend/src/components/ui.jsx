import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, Inbox, Info, Loader2, XCircle } from 'lucide-react'

export function Card({ children, className = '', interactive = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(18,59,93,0.04),0_8px_24px_-12px_rgba(18,59,93,0.12)] sm:p-7 ${
        interactive ? 'transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_2px_4px_rgba(18,59,93,0.06),0_16px_32px_-16px_rgba(18,59,93,0.2)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

const BUTTON_BASE =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold leading-none transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

const BUTTON_VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600',
  secondary: 'bg-white text-navy-800 border-2 border-slate-200 hover:border-brand-300 hover:bg-brand-50',
  outline: 'bg-transparent text-brand-700 border-2 border-brand-600 hover:bg-brand-50',
  destructive: 'bg-danger-600 text-white shadow-sm hover:bg-red-800',
  ghost: 'text-brand-700 hover:bg-brand-50',
}

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

const FIELD_BASE =
  'w-full min-h-12 rounded-xl border-2 bg-white px-4 py-3 text-base text-ink shadow-sm outline-none transition placeholder:text-ink-soft/70 focus:border-brand-500 focus:ring-4 focus:ring-brand-100'

export function Input({ label, error, hint, className = '', id, ...props }) {
  const fieldId = id || props.name
  return (
    <label className="block" htmlFor={fieldId}>
      {label && <span className="mb-1.5 block text-base font-semibold text-navy-800">{label}</span>}
      <input
        id={fieldId}
        className={`${FIELD_BASE} ${error ? 'border-danger-600 focus:border-danger-600 focus:ring-red-100' : 'border-slate-200'} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {hint && !error && <span className="mt-1.5 block text-sm text-ink-soft">{hint}</span>}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-danger-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
    </label>
  )
}

export function Select({ label, error, hint, children, className = '', id, ...props }) {
  const fieldId = id || props.name
  return (
    <label className="block" htmlFor={fieldId}>
      {label && <span className="mb-1.5 block text-base font-semibold text-navy-800">{label}</span>}
      <div className="relative">
        <select
          id={fieldId}
          className={`${FIELD_BASE} appearance-none pr-11 ${error ? 'border-danger-600 focus:border-danger-600 focus:ring-red-100' : 'border-slate-200'} ${className}`}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft" aria-hidden="true" />
      </div>
      {hint && !error && <span className="mt-1.5 block text-sm text-ink-soft">{hint}</span>}
      {error && (
        <span className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-danger-600">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </span>
      )}
    </label>
  )
}

const BADGE_STYLES = {
  slate: 'bg-slate-100 text-navy-800',
  brand: 'bg-brand-50 text-brand-800',
  green: 'bg-success-50 text-success-700',
  yellow: 'bg-warning-50 text-warning-600',
  red: 'bg-danger-50 text-danger-600',
  blue: 'bg-brand-50 text-brand-800',
}

export function Badge({ children, color = 'slate', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${BADGE_STYLES[color]} ${className}`}>
      {children}
    </span>
  )
}

/** Insignia de estado: SIEMPRE icono + texto, nunca solo color — para que la
 * información no dependa únicamente de distinguir tonos (accesibilidad para
 * baja visión / adultos mayores). `config` viene de lib/format.js. */
export function EstadoBadge({ config, className = '' }) {
  if (!config) return null
  const Icono = config.icono
  return (
    <Badge color={config.color} className={className}>
      <Icono className="h-4 w-4 shrink-0" aria-hidden="true" />
      {config.etiqueta}
    </Badge>
  )
}

const ALERT_VARIANTS = {
  info: { classes: 'bg-brand-50 text-navy-800 border-brand-200', icon: Info, iconColor: 'text-brand-600' },
  error: { classes: 'bg-danger-50 text-navy-800 border-red-200', icon: XCircle, iconColor: 'text-danger-600' },
  success: { classes: 'bg-success-50 text-navy-800 border-emerald-200', icon: CheckCircle2, iconColor: 'text-success-600' },
  warning: { classes: 'bg-warning-50 text-navy-800 border-amber-200', icon: AlertTriangle, iconColor: 'text-warning-600' },
}

export function Alert({ children, variant = 'info', className = '' }) {
  const { classes, icon: Icono, iconColor } = ALERT_VARIANTS[variant]
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-base ${classes} ${className}`} role={variant === 'error' ? 'alert' : 'status'}>
      <Icono className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
      <div className="leading-snug">{children}</div>
    </div>
  )
}

export function Spinner({ small = false, className = '' }) {
  const size = small ? 'h-5 w-5' : 'h-9 w-9'
  return <Loader2 className={`${size} animate-spin text-current ${className}`} aria-hidden="true" />
}

export function EmptyState({ title, description, action, icon: Icono = Inbox }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white px-6 py-14 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
        <Icono className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="text-lg font-semibold text-navy-800">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-base text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy-800 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-lg text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CenteredLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
      <Spinner />
      <span className="text-base font-medium">{label}</span>
    </div>
  )
}
