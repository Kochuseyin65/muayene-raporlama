import { format, parseISO, isValid } from 'date-fns'
import { tr } from 'date-fns/locale'

export function formatDate(value?: string | Date | null, fmt: string = 'dd.MM.yyyy') {
  if (!value) return ''
  const d = typeof value === 'string' ? parseISO(value) : value
  if (!isValid(d)) return ''
  return format(d, fmt, { locale: tr })
}

export function formatDateTime(value?: string | Date | null) {
  return formatDate(value, 'dd.MM.yyyy HH:mm')
}

