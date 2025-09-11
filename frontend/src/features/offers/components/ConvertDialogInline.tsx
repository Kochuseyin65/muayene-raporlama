import { Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Button } from '@mui/material'
import { useState } from 'react'

export default function ConvertDialogInline({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (payload: { scheduledDate?: string; notes?: string }) => void }) {
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const submit = () => onSave({ scheduledDate: scheduledDate || undefined, notes: notes || undefined })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>İş Emrine Dönüştür</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField type="date" label="Planlanan Tarih" InputLabelProps={{ shrink: true }} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <TextField label="Notlar" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={3} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>İptal</Button>
        <Button variant="contained" onClick={submit}>Dönüştür</Button>
      </DialogActions>
    </Dialog>
  )
}

