import { useParams } from 'react-router-dom'
import { Box, Button, IconButton, Paper, Stack, TextField, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import PageHeader from '@/components/layout/PageHeader'
import { useGetInspectionQuery } from './inspectionsApi'
import { useToast } from '@/hooks/useToast'
import { useRef, useState } from 'react'

export default function InspectionPhotosPage() {
  const { id } = useParams()
  const inspectionId = Number(id)
  const { data, refetch } = useGetInspectionQuery(inspectionId)
  const ins = data?.data as any
  const { success, error } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const qp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialField = qp.get('field') || 'photos'
  const [fieldName, setFieldName] = useState(initialField)

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const form = new FormData()
    Array.from(files).forEach(f => form.append('photos', f))
    form.append('fieldName', fieldName)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/inspections/${inspectionId}/photos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: form
      })
      if (!res.ok) throw new Error()
      success('Yüklendi')
      refetch()
    } catch { error('Yükleme başarısız') }
  }

  const onDelete = async (url: string) => {
    try {
      const filename = url.split('/').pop() as string
      if (!filename) return
      if (!confirm('Fotoğrafı silmek istiyor musunuz?')) return
      // 1) Backend dosya + photo_urls listesinden sil
      const del = await fetch(`${import.meta.env.VITE_API_BASE_URL}/uploads/inspection-photos/${inspectionId}/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      })
      if (!del.ok) throw new Error('delete failed')
      // 2) inspection_data[fieldName] içinden de kaldır (varsa)
      const current = (ins?.inspection_data || {})
      const arr = Array.isArray(current[fieldName]) ? current[fieldName].filter((u: string) => u !== url) : current[fieldName]
      const body: any = { inspectionData: { ...current, [fieldName]: arr } }
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body)
      })
      success('Silindi')
      refetch()
    } catch (e) {
      error('Silme başarısız')
    }
  }

  if (!ins) return null

  const photosRaw: string[] = Array.from(new Set([...(ins.photo_urls || []), ...((ins.inspection_data?.photos as string[]) || [])]))
  const photos = photosRaw.map((u) => normalizePhotoUrl(u, String(inspectionId)))

  function normalizePhotoUrl(u: string, id: string) {
    if (!u) return u
    // Fix cases like /uploads/inspections//filename
    const dbl = '/uploads/inspections//'
    if (u.startsWith(dbl)) {
      const filename = u.substring(dbl.length)
      return `/uploads/inspections/${id}/${filename}`
    }
    return u
  }

  return (
    <Box>
      <PageHeader title={`Muayene Fotoğrafları ${ins.inspection_number || ''}`} subtitle={`${ins.equipment_name}`} actions={
        <Stack direction="row" spacing={1}>
          <TextField size="small" label="Alan" value={fieldName} onChange={(e)=> setFieldName(e.target.value)} />
          <input ref={fileRef} multiple type="file" accept="image/*" style={{ display: 'none' }} onChange={(e)=> onUpload(e.target.files)} />
          <Button variant="contained" onClick={()=> fileRef.current?.click()}>Yükle</Button>
        </Stack>
      } />

      <Paper sx={{ p: 2 }}>
        {photos.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Fotoğraf yok</Typography>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 2 }}>
            {photos.map((src, idx) => (
              <Box key={idx} sx={{ position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                <img src={`${import.meta.env.VITE_API_BASE_URL}${src}`} alt={String(idx)} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                <IconButton size="small" color="error" onClick={() => onDelete(src)} sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'background.paper' }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  )
}
