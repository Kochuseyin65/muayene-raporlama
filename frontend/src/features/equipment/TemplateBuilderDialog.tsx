import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'

type Equipment = {
  id: number
  name: string
  type: string
  template: any
}

const SECTION_TYPES = [
  { value: 'key_value', label: 'Anahtar-Değer' },
  { value: 'checklist', label: 'Kontrol Listesi' },
  { value: 'table', label: 'Tablo' },
  { value: 'photos', label: 'Fotoğraflar' },
  { value: 'notes', label: 'Notlar' },
]

const VALUE_TYPES = [
  { value: 'text', label: 'Metin' },
  { value: 'number', label: 'Sayı' },
  { value: 'date', label: 'Tarih' },
  { value: 'select', label: 'Seçim' },
]

const SCALE_OPTIONS = [
  { value: 'small', label: 'Küçük (sıkıştırılmış)' },
  { value: 'medium', label: 'Orta (varsayılan)' },
  { value: 'large', label: 'Büyük (ferah)' },
]

const DEFAULT_TEMPLATE_SETTINGS = {
  reportStyle: {
    scale: 'medium',
  },
}

const mergeSettings = (settings?: any) => ({
  reportStyle: {
    ...DEFAULT_TEMPLATE_SETTINGS.reportStyle,
    ...(settings?.reportStyle || {}),
  },
})

const cloneSections = (list?: any[]) => JSON.parse(JSON.stringify(Array.isArray(list) ? list : []))

function slugify(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40) || 'field'
}

export default function TemplateBuilderDialog({ open, onClose, onSave, equipment }: { open: boolean; onClose: () => void; onSave: (template: any) => void; equipment: Equipment }) {
  const initial = useMemo(() => {
    const template = equipment?.template || {}
    return {
      sections: Array.isArray(template?.sections) ? template.sections : [],
      settings: mergeSettings(template?.settings),
    }
  }, [equipment])

  const [sections, setSections] = useState<any[]>(cloneSections(initial.sections))
  const [settings, setSettings] = useState<any>(initial.settings)
  const [showRequired, setShowRequired] = useState(true)

  useEffect(() => {
    if (!open) return
    setSections(cloneSections(initial.sections))
    setSettings(mergeSettings(initial.settings))
  }, [open, equipment?.id])

  const handleScaleChange = (value: string) => {
    setSettings((prev: any) => ({
      reportStyle: {
        ...mergeSettings(prev).reportStyle,
        scale: value,
      },
    }))
  }

  const addSection = () => {
    setSections((arr) => ([...arr, { type: 'key_value', title: 'Yeni Bölüm', items: [] }]))
  }
  const removeSection = (idx: number) => setSections((arr) => arr.filter((_, i) => i !== idx))
  const moveUp = (idx: number) => setSections((arr) => idx <= 0 ? arr : arr.map((s, i) => i === idx - 1 ? arr[idx] : i === idx ? arr[idx - 1] : s))
  const moveDown = (idx: number) => setSections((arr) => idx >= arr.length - 1 ? arr : arr.map((s, i) => i === idx + 1 ? arr[idx] : i === idx ? arr[idx + 1] : s))

  const changeType = (idx: number, t: string) => {
    setSections((arr) => arr.map((sec, i) => {
      if (i !== idx) return sec
      const title = sec.title || 'Bölüm'
      if (t === 'key_value') return { type: 'key_value', title, items: [] }
      if (t === 'checklist') return { type: 'checklist', title, questions: [] }
      if (t === 'table') return { type: 'table', title, field: sec.field || slugify(title), columns: [] }
      if (t === 'photos') return { type: 'photos', title, field: sec.field || 'photos', maxCount: 12 }
      if (t === 'notes') return { type: 'notes', title, field: sec.field || 'notes' }
      return { ...sec, type: t }
    }))
  }

  const updateSec = (idx: number, patch: any) => setSections((arr) => arr.map((s, i) => (i === idx ? { ...s, ...patch } : s)))

  const handleSave = () => {
    const template = { settings: mergeSettings(settings), sections }
    onSave(template)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Şablon Düzenle</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Rapor Tasarım Seçenekleri</Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <FormControl sx={{ minWidth: 220 }}>
                <InputLabel>Yazı Boyutu ve Boşluk</InputLabel>
                <Select
                  label="Yazı Boyutu ve Boşluk"
                  value={mergeSettings(settings).reportStyle.scale}
                  onChange={(e) => handleScaleChange(String(e.target.value))}
                >
                  {SCALE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                Seçilen ölçek bu ekipman şablonu ile oluşturulan raporların yazı tipi, margin ve padding değerlerini otomatik olarak düzenler.
              </Typography>
            </Stack>
          </Paper>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Button variant="outlined" onClick={addSection}>Bölüm Ekle</Button>
            <FormControlLabel control={<Switch checked={showRequired} onChange={(e)=> setShowRequired(e.target.checked)} />} label="Zorunlu alan anahtarını göster" />
          </Stack>
          {sections.length === 0 && (
            <Typography variant="body2" color="text.secondary">Henüz bölüm yok. “Bölüm Ekle” ile başlayın.</Typography>
          )}
          {sections.map((sec, idx) => (
            <Paper key={idx} sx={{ p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <TextField label="Bölüm Başlığı" value={sec.title || ''} onChange={(e)=> updateSec(idx, { title: e.target.value })} fullWidth />
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Tür</InputLabel>
                  <Select label="Tür" value={sec.type || 'key_value'} onChange={(e)=> changeType(idx, String(e.target.value))}>
                    {SECTION_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={1} sx={{ ml: 'auto' }}>
                  <IconButton size="small" onClick={() => moveUp(idx)} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => moveDown(idx)} disabled={idx === sections.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={() => removeSection(idx)}><DeleteIcon fontSize="small" /></IconButton>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2 }} />

              {sec.type === 'key_value' && (
                <KeyValueEditor
                  items={Array.isArray(sec.items) ? sec.items : []}
                  onChange={(items) => updateSec(idx, { items })}
                  showRequired={showRequired}
                />
              )}
              {sec.type === 'checklist' && (
                <ChecklistEditor
                  questions={Array.isArray(sec.questions) ? sec.questions : []}
                  onChange={(questions) => updateSec(idx, { questions })}
                />
              )}
              {sec.type === 'table' && (
                <TableEditor
                  field={sec.field || slugify(sec.title || 'table')}
                  columns={Array.isArray(sec.columns) ? sec.columns : []}
                  onChange={(val) => updateSec(idx, val)}
                />
              )}
              {sec.type === 'photos' && (
                <PhotosEditor
                  field={sec.field || 'photos'}
                  title={sec.title || ''}
                  maxCount={typeof sec.maxCount === 'number' ? sec.maxCount : 12}
                  onChange={(patch) => updateSec(idx, patch)}
                />
              )}
              {sec.type === 'notes' && (
                <NotesEditor
                  field={sec.field || 'notes'}
                  onChange={(field) => updateSec(idx, { field })}
                />
              )}
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={handleSave}>Kaydet</Button>
      </DialogActions>
    </Dialog>
  )
}

function KeyValueEditor({ items, onChange, showRequired }: { items: any[]; onChange: (items: any[]) => void; showRequired: boolean }) {
  const addItem = () => onChange([...
    items,
    { name: `field_${items.length + 1}`, label: '', valueType: 'text', required: false },
  ])
  const update = (i: number, patch: any) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))
  const moveUp = (i: number) => onChange(i <= 0 ? items : items.map((it, idx) => idx === i - 1 ? items[i] : idx === i ? items[i - 1] : it))
  const moveDown = (i: number) => onChange(i >= items.length - 1 ? items : items.map((it, idx) => idx === i + 1 ? items[i] : idx === i ? items[i + 1] : it))
  return (
    <Stack spacing={1}>
      {items.map((it, idx) => (
        <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField label="Ad (name)" value={it.name || ''} onChange={(e)=> update(idx, { name: slugify(e.target.value) })} sx={{ minWidth: 200 }} />
          <TextField label="Etiket (label)" value={it.label || ''} onChange={(e)=> update(idx, { label: e.target.value })} sx={{ flex: 1 }} />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Tip</InputLabel>
            <Select label="Tip" value={it.valueType || 'text'} onChange={(e)=> update(idx, { valueType: e.target.value })}>
              {VALUE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          {showRequired && (
            <FormControlLabel control={<Switch checked={!!it.required} onChange={(e)=> update(idx, { required: e.target.checked })} />} label="Zorunlu" />
          )}
          <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
            <IconButton size="small" onClick={() => moveUp(idx)} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => moveDown(idx)} disabled={idx === items.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={() => remove(idx)}><DeleteIcon fontSize="small" /></IconButton>
          </Stack>
          {(it.valueType === 'select') && (
            <OptionsEditor value={Array.isArray(it.options) ? it.options : []} onChange={(opt) => update(idx, { options: opt })} />
          )}
        </Stack>
      ))}
      <Box>
        <Button variant="outlined" size="small" onClick={addItem}>Alan Ekle</Button>
      </Box>
    </Stack>
  )
}

function ChecklistEditor({ questions, onChange }: { questions: any[]; onChange: (questions: any[]) => void }) {
  const add = () => onChange([...
    questions,
    { name: `q_${questions.length + 1}`, label: '', options: ['Uygun', 'Uygun Değil', 'N/A'] },
  ])
  const update = (i: number, patch: any) => onChange(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)))
  const remove = (i: number) => onChange(questions.filter((_, idx) => idx !== i))
  const moveUp = (i: number) => onChange(i <= 0 ? questions : questions.map((q, idx) => idx === i - 1 ? questions[i] : idx === i ? questions[i - 1] : q))
  const moveDown = (i: number) => onChange(i >= questions.length - 1 ? questions : questions.map((q, idx) => idx === i + 1 ? questions[i] : idx === i ? questions[i + 1] : q))
  return (
    <Stack spacing={1}>
      {questions.map((q, idx) => (
        <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField label="Ad (name)" value={q.name || ''} onChange={(e)=> update(idx, { name: slugify(e.target.value) })} sx={{ minWidth: 200 }} />
          <TextField label="Soru (label)" value={q.label || ''} onChange={(e)=> update(idx, { label: e.target.value })} sx={{ flex: 1 }} />
          <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
            <IconButton size="small" onClick={() => moveUp(idx)} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => moveDown(idx)} disabled={idx === questions.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={() => remove(idx)}><DeleteIcon fontSize="small" /></IconButton>
          </Stack>
          <OptionsEditor value={Array.isArray(q.options) ? q.options : []} onChange={(opt) => update(idx, { options: opt })} />
        </Stack>
      ))}
      <Box>
        <Button variant="outlined" size="small" onClick={add}>Soru Ekle</Button>
      </Box>
    </Stack>
  )
}

function TableEditor({ field, columns, onChange }: { field: string; columns: any[]; onChange: (patch: any) => void }) {
  const addCol = () => onChange({ field, columns: [...columns, { name: `col_${columns.length + 1}`, label: '', type: 'text' }] })
  const update = (i: number, patch: any) => onChange({ field, columns: columns.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) })
  const remove = (i: number) => onChange({ field, columns: columns.filter((_, idx) => idx !== i) })
  const moveUp = (i: number) => onChange({ field, columns: i <= 0 ? columns : columns.map((c, idx) => idx === i - 1 ? columns[i] : idx === i ? columns[i - 1] : c) })
  const moveDown = (i: number) => onChange({ field, columns: i >= columns.length - 1 ? columns : columns.map((c, idx) => idx === i + 1 ? columns[i] : idx === i ? columns[i + 1] : c) })
  return (
    <Stack spacing={1}>
      <TextField label="Alan Adı (field)" value={field} onChange={(e)=> onChange({ field: slugify(e.target.value), columns })} sx={{ maxWidth: 360 }} />
      {columns.map((c, idx) => (
        <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField label="Sütun Adı (name)" value={c.name || ''} onChange={(e)=> update(idx, { name: slugify(e.target.value) })} sx={{ minWidth: 200 }} />
          <TextField label="Etiket (label)" value={c.label || ''} onChange={(e)=> update(idx, { label: e.target.value })} sx={{ flex: 1 }} />
          <FormControl sx={{ minWidth: 160 }}>
            <InputLabel>Tip</InputLabel>
            <Select label="Tip" value={c.type || 'text'} onChange={(e)=> update(idx, { type: e.target.value })}>
              {VALUE_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
          <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
            <IconButton size="small" onClick={() => moveUp(idx)} disabled={idx === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => moveDown(idx)} disabled={idx === columns.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
            <IconButton size="small" color="error" onClick={() => remove(idx)}><DeleteIcon fontSize="small" /></IconButton>
          </Stack>
        </Stack>
      ))}
      <Box>
        <Button variant="outlined" size="small" onClick={addCol}>Sütun Ekle</Button>
      </Box>
    </Stack>
  )
}

function PhotosEditor({ field, title, maxCount, onChange }: { field: string; title: string; maxCount: number; onChange: (patch: any) => void }) {
  return (
    <Stack spacing={1}>
      <TextField label="Alan Adı (field)" value={field} onChange={(e)=> onChange({ field: slugify(e.target.value) })} sx={{ maxWidth: 360 }} />
      <TextField label="Başlık (title)" value={title} onChange={(e)=> onChange({ title: e.target.value })} />
      <TextField label="Maksimum Fotoğraf" type="number" value={maxCount} onChange={(e)=> onChange({ maxCount: Number(e.target.value || 0) })} sx={{ maxWidth: 220 }} />
    </Stack>
  )
}

function NotesEditor({ field, onChange }: { field: string; onChange: (field: string) => void }) {
  return (
    <Stack spacing={1}>
      <TextField label="Alan Adı (field)" value={field} onChange={(e)=> onChange(slugify(e.target.value))} sx={{ maxWidth: 360 }} />
      <Typography variant="body2" color="text.secondary">Not alanı serbest metin olarak kullanılır.</Typography>
    </Stack>
  )
}

function OptionsEditor({ value, onChange }: { value: any[]; onChange: (v: any[]) => void }) {
  const [opt, setOpt] = useState('')
  const add = () => {
    const v = opt.trim()
    if (!v) return
    onChange([...(Array.isArray(value) ? value : []), v])
    setOpt('')
  }
  const remove = (idx: number) => onChange((value || []).filter((_: any, i: number) => i !== idx))
  return (
    <Stack spacing={0.5} sx={{ border: '1px dashed', borderColor: 'divider', p: 1, borderRadius: 1, minWidth: 260 }}>
      <Typography variant="caption" color="text.secondary">Seçenekler</Typography>
      <Stack direction="row" spacing={1}>
        <TextField size="small" label="Yeni seçenek" value={opt} onChange={(e)=> setOpt(e.target.value)} sx={{ flex: 1 }} />
        <Button size="small" variant="outlined" onClick={add}>Ekle</Button>
      </Stack>
      {(value || []).length === 0 ? (
        <Typography variant="caption" color="text.secondary">Henüz seçenek yok.</Typography>
      ) : (
        <Stack spacing={0.5}>
          {(value || []).map((v: any, idx: number) => (
            <Stack key={idx} direction="row" spacing={1} alignItems="center">
              <TextField size="small" value={typeof v === 'string' ? v : (v?.label || '')} onChange={(e)=> {
                const nv = e.target.value
                const arr = [...value]
                arr[idx] = typeof v === 'string' ? nv : { ...(v || {}), label: nv, value: (v?.value ?? nv) }
                onChange(arr)
              }} sx={{ flex: 1 }} />
              <IconButton size="small" color="error" onClick={()=> remove(idx)}><DeleteIcon fontSize="small" /></IconButton>
            </Stack>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
