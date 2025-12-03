// src/components/OperatorControlPanel.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OperatorChronometer from './OperatorChronometer';

interface OperatorControlPanelProps {
  job: any; // In a real app, use a proper type
  onBackToList: () => void;
}

interface StopEvent {
  cause: string;
  timestamp: Date;
}

export default function OperatorControlPanel({ job, onBackToList }: OperatorControlPanelProps) {
  const [isTirajeActive, setIsTirajeActive] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isPuestaPunto, setIsPuestaPunto] = useState(false);
  const [paradaCause, setParadaCause] = useState('');
  const [stopsHistory, setStopsHistory] = useState<StopEvent[]>([]);

  const handleStop = () => {
    if (paradaCause) {
      setStopsHistory([...stopsHistory, { cause: paradaCause, timestamp: new Date() }]);
    }
    setIsPaused(true);
    // Here you would also update the job status globally
  };

  const handleResume = () => {
    setIsPaused(false);
    setParadaCause('');
    // Here you would also update the job status globally
  };

  const handleFinish = () => {
    setIsTirajeActive(false);
    onBackToList();
    // Here you would update the job as 'completed'
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBackToList}
        sx={{ mb: 2 }}
      >
        Volver al listado
      </Button>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        {job.id} - {job.client}
      </Typography>

      {/* Main Controls */}
      <Paper elevation={3} sx={{ p: 8, my: 5 }}>
        <Typography variant="h4" align="center" gutterBottom>Tiempo de Tiraje</Typography>
        <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
          {isPaused ? (
              <Button variant="contained" color="primary" size="large" onClick={handleResume} sx={{ fontSize: '1.0rem', px: 5, py: 2.5 }}>
                Reanudar
              </Button>
            ) : (
              <Button variant="contained" color="warning" size="large" onClick={handleStop} disabled={!isTirajeActive} sx={{ fontSize: '1.0rem', px: 5, py: 2.5 }}>
                Pausar
              </Button>
            )}
          <AccessTimeIcon sx={{ fontSize: 80, color: isTirajeActive && !isPaused ? 'inherit' : 'text.disabled' }} />
          <OperatorChronometer running={isTirajeActive && !isPaused} variant="h1"/>
          <Button variant="contained" color="error" size="large" onClick={handleFinish} disabled={!isTirajeActive} sx={{ fontSize: '1.0rem', px: 5, py: 2.5 }}>
            Finalizar
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={4}>
        {/* Puesta a Punto */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Puesta a Punto
                </Typography>
                <OperatorChronometer running={isPuestaPunto} variant="h5" />
              </Box>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => setIsPuestaPunto(true)}
                  disabled={!isTirajeActive || isPuestaPunto || isPaused}
                >
                  Iniciar Puesta a Punto
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => setIsPuestaPunto(false)}
                  disabled={!isPuestaPunto || isPaused}
                >
                  Finalizar Puesta a Punto
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Registros de Pausas */}
        <Grid item xs={12}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                Registros de Pausas
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }} disabled={!isTirajeActive || isPaused}>
                <InputLabel id="parada-select-label">Causa de la Pausa</InputLabel>
                <Select
                  labelId="parada-select-label"
                  value={paradaCause}
                  label="Causa de la Pausa"
                  onChange={(e) => setParadaCause(e.target.value)}
                >
                  <MenuItem value=""><em>Seleccione una causa</em></MenuItem>
                  <MenuItem value={"cambio_plancha"}>Cambio de Plancha</MenuItem>
                  <MenuItem value={"falta_papel"}>Falta de Papel</MenuItem>
                  <MenuItem value={"ajuste_color"}>Ajuste de Color</MenuItem>
                  <MenuItem value={"limpieza"}>Limpieza</MenuItem>
                  <MenuItem value={"otro"}>Otro</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                sx={{ mt: 2, mb: 2 }}
                onClick={handleStop}
                disabled={!isTirajeActive || !paradaCause || isPaused}
                fullWidth
              >
                Registrar y Pausar
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Historial de Pausas</Typography>
              <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                {stopsHistory.length > 0 ? (
                  <List dense>
                    {stopsHistory.map((stop, index) => (
                      <ListItem key={index}>
                        <ListItemText
                          primary={stop.cause.replace(/_/g, ' ')}
                          secondary={stop.timestamp.toLocaleTimeString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                    Aún no hay pausas registradas.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
