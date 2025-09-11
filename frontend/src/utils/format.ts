export function formatCurrencyTRY(value: number) {
  if (value == null) return ''
  try {
    return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 })
  } catch {
    return `${value} ₺`
  }
}

