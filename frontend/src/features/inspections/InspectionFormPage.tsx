import { useParams } from 'react-router-dom'
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import PageHeader from '@/components/layout/PageHeader'
import { useGetInspectionQuery } from './inspectionsApi'
import { useToast } from '@/hooks/useToast'
import { useState, useEffect } from 'react'
import TableFieldEditor from './components/TableFieldEditor'

export default function InspectionFormPage() {
  const { id } = useParams()
  const inspectionId = Number(id)
  const { data, refetch } = useGetInspectionQuery(inspectionId)
  const ins = data?.data as any
  const { success, error } = useToast()
  const [values, setValues] = useState<Record<string, any>>({})
  const [date, setDate] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [startErr, setStartErr] = useState('')
  const [endErr, setEndErr] = useState('')

  const hhmm = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  const normalizeTime = (s?: string | null) => {
    if (!s) return ''
    // accept HH:MM or HH:MM:SS → return HH:MM
    const m = String(s).match(/^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*$/)
    if (m) {
      const h = m[1].padStart(2, '0')
      return `${h}:${m[2]}`
    }
    return String(s)
  }

  useEffect(() => {
    if (ins) {
      setValues(ins.inspection_data || {})
      setDate(ins.inspection_date ? String(ins.inspection_date).slice(0,10) : '')
      setStart(normalizeTime(ins.start_time))
      setEnd(normalizeTime(ins.end_time))
    }
  }, [ins])

  const updateField = (name: string, val: any) => setValues((v) => ({ ...v, [name]: val }))

  const onSave = async () => {
    try {
      // client-side time validation (backend expects HH:MM)
      const ns = normalizeTime(start)
      const ne = normalizeTime(end)
      setStart(ns); setEnd(ne)
      setStartErr(''); setEndErr('')
      if (ns && !hhmm.test(ns)) { setStartErr('Saat HH:MM olmalı'); return }
      if (ne && !hhmm.test(ne)) { setEndErr('Saat HH:MM olmalı'); return }
      const r1 = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ inspectionData: values, inspectionDate: date || undefined, startTime: ns || undefined, endTime: ne || undefined })
      })
      if (!r1.ok) {
        let msg = `PUT failed ${r1.status}`
        try { const js = await r1.json(); msg = js?.error?.message || msg } catch {}
        throw new Error(msg)
      }
      const r2 = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inspections/${inspectionId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (!r2.ok) {
        let msg = `SAVE failed ${r2.status}`
        try { const js = await r2.json(); msg = js?.error?.message || msg } catch {}
        throw new Error(msg)
      }
      success('Kaydedildi')
      refetch()
    } catch (e: any) {
      console.error(e)
      error(e?.message || 'Kaydetme başarısız')
    }
  }

  const onComplete = async () => {
    try {
      const ns = normalizeTime(start)
      const ne = normalizeTime(end)
      setStart(ns); setEnd(ne)
      setStartErr(''); setEndErr('')
      if (ns && !hhmm.test(ns)) { setStartErr('Saat HH:MM olmalı'); return }
      if (ne && !hhmm.test(ne)) { setEndErr('Saat HH:MM olmalı'); return }

      const r1 = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ inspectionData: values, inspectionDate: date || undefined, startTime: ns || undefined, endTime: ne || undefined })
      })
      if (!r1.ok) {
        let msg = `PUT failed ${r1.status}`
        try { const js = await r1.json(); msg = js?.error?.message || msg } catch {}
        throw new Error(msg)
      }
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inspections/${inspectionId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (!res.ok) {
        let msg = `COMPLETE failed ${res.status}`
        try { const js = await res.json(); msg = js?.error?.message || msg } catch {}
        throw new Error(msg)
      }
      success('Tamamlandı')
      refetch()
    } catch (e: any) {
      console.error(e)
      error(e?.message || 'Tamamlama başarısız')
    }
  }

  if (!ins) return null

  const template = ins.template || { sections: [] }

  return (
    <Box>
      <PageHeader title={`Muayene Formu ${ins.inspection_number || ''}`} subtitle={`${ins.equipment_name} • ${ins.technician_name} ${ins.technician_surname}`}
        actions={<Stack direction="row" spacing={1}><Button variant="outlined" onClick={onSave}>Kaydet</Button><Button variant="contained" onClick={onComplete}>Tamamla</Button></Stack>} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField fullWidth type="date" label="Tarih" InputLabelProps={{ shrink: true }} value={date} onChange={(e)=> setDate(e.target.value)} />
          <TextField fullWidth label="Başlangıç" placeholder="HH:MM" value={start} onChange={(e)=> setStart(e.target.value)} error={!!startErr} helperText={startErr || ''} />
          <TextField fullWidth label="Bitiş" placeholder="HH:MM" value={end} onChange={(e)=> setEnd(e.target.value)} error={!!endErr} helperText={endErr || ''} />
        </Stack>
      </Paper>

      {template.sections?.map((sec: any, sIdx: number) => {
        const fields: any[] = []
        if (Array.isArray(sec.fields)) {
          // Legacy format
          fields.push(...sec.fields)
        } else if (sec.type) {
          const t = sec.type
          if (t === 'key_value' && Array.isArray(sec.items)) {
            sec.items.forEach((it: any) => fields.push({ name: it.name, label: it.label || it.name, type: it.valueType || 'text', options: it.options }))
          } else if (t === 'checklist' && Array.isArray(sec.questions)) {
            sec.questions.forEach((q: any) => fields.push({ name: q.name, label: q.label || q.name, type: 'select', options: q.options }))
          } else if (t === 'table') {
            const fname = sec.field || `table_${sIdx}`
            fields.push({ name: fname, label: sec.title || fname, type: 'table', columns: sec.columns })
          } else if (t === 'notes') {
            const fname = sec.field || `notes_${sIdx}`
            fields.push({ name: fname, label: sec.title || fname, type: 'text' })
          } else if (t === 'photos') {
            const fname = sec.field || `photos_${sIdx}`
            fields.push({ name: fname, label: sec.title || fname, type: 'photos' })
          }
        }

        return (
          <Paper key={sIdx} sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>{sec.title || `Bölüm ${sIdx+1}`}</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
              {fields.map((f: any, idx: number) => (
                <Box key={idx} sx={{ flex: '1 1 300px', minWidth: 280 }}>
                  <FieldInput inspectionId={inspectionId} field={f} value={values[f.name]} allValues={values} onChange={(v:any)=> updateField(f.name, v)} />
                </Box>
              ))}
              {fields.length === 0 && (
                <Typography variant="body2" color="text.secondary">Bu bölümde düzenlenecek alan yok.</Typography>
              )}
            </Stack>
          </Paper>
        )
      })}
    </Box>
  )
}

function FieldInput({ inspectionId, field, value, allValues, onChange }: { inspectionId: number; field: any; value: any; allValues: Record<string, any>; onChange: (v:any)=>void }) {
  const label = field.label || field.name
  const goPhotos = () => {
    const p = new URLSearchParams({ field: field.name }).toString()
    window.location.href = `/inspections/${inspectionId}/photos?${p}`
  }
  const normalizePhotoUrl = (u: string) => {
    if (!u) return u
    const dbl = '/uploads/inspections//'
    if (u.startsWith(dbl)) {
      const filename = u.substring(dbl.length)
      return `/uploads/inspections/${inspectionId}/${filename}`
    }
    return u
  }
  switch (field.type) {
    case 'number':
      return <TextField fullWidth type="number" label={label} value={value ?? ''} onChange={(e)=> onChange(e.target.value === '' ? null : Number(e.target.value))} required={!!field.required} />
    case 'date':
      return <TextField fullWidth type="date" label={label} InputLabelProps={{ shrink: true }} value={value ?? ''} onChange={(e)=> onChange(e.target.value || null)} required={!!field.required} />
    case 'select':
      return <TextField fullWidth select label={label} value={value ?? ''} onChange={(e)=> onChange(e.target.value)} required={!!field.required}>
        {(field.options || []).map((opt: any) => <MenuItem key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</MenuItem>)}
      </TextField>
    case 'table':
      return <TableFieldEditor columns={(field.columns || []).map((c:any)=>({ name: c.name, label: c.label, type: c.type }))} value={Array.isArray(value)? value: []} onChange={onChange} />
    case 'photo':
    case 'photos': {
      const fallback = Array.isArray(allValues?.photos) ? allValues.photos : []
      const photos: string[] = Array.from(new Set([...(Array.isArray(value)? value: [] ), ...fallback]))
        .map((u) => normalizePhotoUrl(u))
      return (
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            <Button size="small" variant="outlined" onClick={goPhotos}>Fotoğrafları Yönet</Button>
          </Stack>
          {photos.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Bu alanda fotoğraf yok</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 1 }}>
              {photos.map((src, idx) => (
                <Box key={idx} sx={{ borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <img src={`${import.meta.env.VITE_API_BASE_URL}${src}`} alt={String(idx)} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )
    }
    default:
      return <TextField fullWidth label={label} value={value ?? ''} onChange={(e)=> onChange(e.target.value)} required={!!field.required} />
  }
}
