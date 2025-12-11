// src/components/JobEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Modal, Box, Typography, TextField, Button, Stack, Select, MenuItem, FormControl, InputLabel,
  Checkbox, FormControlLabel, FormGroup, FormLabel, RadioGroup, Radio, Divider, InputAdornment, Grid
} from '@mui/material';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '90%', sm: 450 },
  bgcolor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent background
  backdropFilter: 'blur(5px)', // Frosted glass effect
  boxShadow: 24,
  p: 2, // Reduced padding
  borderRadius: 2,
  maxHeight: '90vh',
  overflowY: 'auto',
};

const pressOptions = ['Prensa 102', 'Prensa 74', 'Prensa 52'];
const statusOptions = ['en_cola', 'en_curso', 'en_pausa', 'terminado'];
const defaultChecklist = { pantone: false, barniz: false, colors: '4x0' };

export default function JobEditor({ job, open, onClose, onSave }: { job: any, open: boolean, onClose: () => void, onSave: (job: any) => void}) {
  const [formData, setFormData] = useState({
    _id: job?._id || undefined,
    ot: job?.ot || '',
    client: job?.client || '',
    jobType: job?.jobType || '',
    press: job?.press || pressOptions[0],
    status: job?.status || 'en_cola',
    quantityPlanned: job?.quantityPlanned || 0,

    comments: job?.comments || '',
    checklist: job?.checklist || defaultChecklist,
  });

  useEffect(() => {
    const initialData = job?._id ? {
      _id: job._id,
      ot: job.ot || '',
      client: job.client || '',
      jobType: job.jobType || '',
      press: job.press || pressOptions[0],
      status: job.status || 'en_cola',
      quantityPlanned: job.quantityPlanned || 0,
      comments: job.comments || '',
      checklist: job.checklist || defaultChecklist,
    } : {
      _id: undefined,
      ot: '',
      client: '',
      jobType: '',
      press: pressOptions[0],
      status: 'en_cola',
      quantityPlanned: 0,
      comments: '',
      checklist: defaultChecklist,
    };
    setFormData(initialData);
  }, [job, open]);

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
    setFormData((prev: any) => ({ ...prev, status: 'en_cola' }));
  };

  const handleSave = () => {
    if (formData) {
        onSave(formData);
    }
    onClose();
  };

  if (!open || !formData) return null;

  const isNew = !job?._id;

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {isNew ? 'Crear Nueva OT' : 'Editar OT'}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="OT"
              name="ot"
              value={(formData.ot || '').replace(/^OT-/, '')}
              onChange={(e) => handleChange({ target: { name: 'ot', value: `OT-${e.target.value}` } })}
              fullWidth
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start">OT-</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Prensa</InputLabel>
              <Select name="press" value={formData.press} label="Prensa" onChange={handleChange}>
                {pressOptions.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Nombre/Tipo de Trabajo" name="jobType" value={formData.jobType} onChange={handleChange} size="small" fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Cliente" name="client" value={formData.client} onChange={handleChange} size="small" fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Cantidad de Tiraje" name="quantityPlanned" value={formData.quantityPlanned} onChange={handleChange} type="number" size="small" fullWidth />
          </Grid>
          
          {!isNew && (
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select name="status" value={formData.status} label="Estado" onChange={handleChange}>
                  {statusOptions.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid item xs={12}>
            <FormControl component="fieldset" variant="standard">
              <FormLabel component="legend" sx={{ fontSize: '0.9rem' }}>Checklist</FormLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                <FormGroup row>
                  <FormControlLabel control={<Checkbox size="small" checked={formData.checklist?.pantone || false} onChange={handleChecklistChange} name="pantone" />} label={<Typography variant="body2">Pantone</Typography>} />
                  <FormControlLabel control={<Checkbox size="small" checked={formData.checklist?.barniz || false} onChange={handleChecklistChange} name="barniz" />} label={<Typography variant="body2">Barniz</Typography>} />
                </FormGroup>
                <RadioGroup row name="colors" value={formData.checklist?.colors || '4x0'} onChange={handleColorChange}>
                  <FormControlLabel value="4x0" control={<Radio size="small" />} label={<Typography variant="body2">4x0</Typography>} />
                  <FormControlLabel value="4x4" control={<Radio size="small" />} label={<Typography variant="body2">4x4</Typography>} />
                </RadioGroup>
              </Stack>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>
          
          <Grid item xs={12}>
            <TextField label="Comentarios" name="comments" value={formData.comments} onChange={handleChange} multiline rows={2} size="small" fullWidth />
          </Grid>

          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
              <Button onClick={onClose}>Cancelar</Button>
              <Button variant="contained" onClick={handleSave} disabled={!formData.ot || !formData.client || !formData.jobType}>Guardar</Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}