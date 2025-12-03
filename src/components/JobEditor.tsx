// src/components/JobEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, FormGroup, FormLabel, RadioGroup, Radio, Divider, InputAdornment
} from '@mui/material';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 800, // Increased width
  bgcolor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent background
  backdropFilter: 'blur(5px)', // Frosted glass effect
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const pressOptions = ['Prensa 102', 'Prensa 74', 'Prensa 52'];
const statusOptions = ['en cola', 'en_curso', 'en pausa', 'terminado'];
const defaultChecklist = { pantone: false, barniz: false, colors: '4x0' }; // Default to 4x0

export default function JobEditor({ job, open, onClose, onSave }: { job: any, open: boolean, onClose: () => void, onSave: (job: any) => void}) {
  const [formData, setFormData] = useState({
    _id: job?._id || undefined,
    ot: job?.ot || '',
    client: job?.client || '',
    jobType: job?.jobType || '',
    press: job?.press || pressOptions[0],
    status: job?.status || 'en cola',
    quantityPlanned: job?.quantityPlanned || 0, // Renamed from quantity

    comments: job?.comments || '',
    checklist: job?.checklist || defaultChecklist,
  });

  useEffect(() => {
    // Determine initial form data based on whether a job is provided for editing
    const initialData = job?._id ? {
      _id: job._id,
      ot: job.ot || '',
      client: job.client || '',
      jobType: job.jobType || '',
      press: job.press || pressOptions[0],
      status: job.status || 'en cola',
      quantityPlanned: job.quantityPlanned || 0,
      comments: job.comments || '',
      checklist: job.checklist || defaultChecklist,
    } : { // Default values for a new job
      _id: undefined,
      ot: '',
      client: '',
      jobType: '',
      press: pressOptions[0],
      status: 'en cola',
      quantityPlanned: 0,
      comments: '',
      checklist: defaultChecklist,
    };
    setFormData(initialData);
  }, [job?._id, open]);

  const handleChange = (e: any) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleChecklistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      checklist: { ...prev.checklist, [name]: checked },
    }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev: any) => ({
      ...prev,
      checklist: { ...prev.checklist, colors: e.target.value },
    }));
  };

  const handleResetStatus = () => {
    setFormData((prev: any) => ({ ...prev, status: 'en cola' }));
  };

  const handleSave = () => {
    if (formData) {
        onSave(formData);
    }
    onClose();
  };

  if (!open || !formData) return null;

  const isNew = !job?._id; // Check _id for new job

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">
          {isNew ? 'Crear Nueva Orden de Trabajo' : 'Editar Orden de Trabajo'}
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2}>
            <TextField
              label="OT"
              name="ot"
              value={(formData.ot || '').replace(/^OT-/, '')}
              onChange={(e) => handleChange({ target: { name: 'ot', value: `OT-${e.target.value}` } })}

              helperText={isNew ? "Identificador único" : ""}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">OT-</InputAdornment>,
              }}
            />
            <FormControl fullWidth>
              <InputLabel>Prensa</InputLabel>
              <Select name="press" value={formData.press} label="Prensa" onChange={handleChange}>
                {pressOptions.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <TextField label="Nombre/Tipo de Trabajo" name="jobType" value={formData.jobType} onChange={handleChange} />
          <TextField label="Cliente" name="client" value={formData.client} onChange={handleChange} />
          <TextField label="Cantidad de Tiraje" name="quantityPlanned" value={formData.quantityPlanned} onChange={handleChange} type="number" />
          
          {!isNew && (
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="status" value={formData.status} label="Estado" onChange={handleChange}>
                {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          )}

          <Divider sx={{ my: 1 }} />

          <FormControl component="fieldset" variant="standard">
            <FormLabel component="legend">Checklist de Producción</FormLabel>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormGroup row>
                <FormControlLabel control={<Checkbox checked={formData.checklist?.pantone || false} onChange={handleChecklistChange} name="pantone" />} label="Pantone" />
                <FormControlLabel control={<Checkbox checked={formData.checklist?.barniz || false} onChange={handleChecklistChange} name="barniz" />} label="Barniz S/Impresión" />
              </FormGroup>
              <RadioGroup row name="colors" value={formData.checklist?.colors || '4x0'} onChange={handleColorChange}>
                <FormControlLabel value="4x0" control={<Radio />} label="4x0" />
                <FormControlLabel value="4x4" control={<Radio />} label="4x4" />
              </RadioGroup>
            </Stack>
          </FormControl>

          <Divider sx={{ my: 1 }} />
          
          <TextField label="Comentarios" name="comments" value={formData.comments} onChange={handleChange} multiline rows={1} />

          <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ pt: 2 }}>
            <Box>
              {['en curso', 'en pausa'].includes(formData.status) && (
                <Button onClick={handleResetStatus} color="secondary">
                  Reiniciar Estado a 'en cola'
                </Button>
              )}
            </Box>
            <Stack direction="row" spacing={2}>
              <Button onClick={onClose}>Cancelar</Button>
              <Button variant="contained" onClick={handleSave} disabled={!formData.ot || !formData.client || !formData.jobType}>Guardar</Button>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </Modal>
  );
}