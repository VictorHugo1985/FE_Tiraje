// src/components/OperatorControlPanel.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
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
  Fab,
  TextField,
  Chip // Import Chip
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import OperatorChronometer from './OperatorChronometer';
import ConfirmationDialog from './ConfirmationDialog';
import { updateJob, addTimelineEvent, TimelineEventType, getPauseCauses } from '../services/api';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

interface PauseCause {
  _id: string;
  name: string;
  description?: string;
}

interface OperatorControlPanelProps {
  job: any; // In a real app, use a proper type
  onBackToList: () => void;
  refetchJob: () => Promise<void>; // New prop
  disableAllControls: boolean; // New prop to disable all controls
}

// ... (el resto de los helpers como formatTime y getEventPairs se mantienen igual)
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getEventPairs = (timeline: any[], startType: TimelineEventType, endType: TimelineEventType) => {
  const pairs: { start: Date | null; end: Date | null; cause?: string }[] = [];
  let currentStart: Date | null = null;
  let currentCause: string | undefined = undefined;

  const sortedTimeline = [...timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  sortedTimeline.forEach(event => {
    if (event.type === startType) {
      currentStart = new Date(event.timestamp);
      currentCause = event.details?.cause;
    } else if (event.type === endType && currentStart) {
      pairs.push({ start: currentStart, end: new Date(event.timestamp), cause: currentCause });
      currentStart = null;
      currentCause = undefined;
    }
  });

  if (currentStart) {
    pairs.push({ start: currentStart, end: null, cause: currentCause });
  }

  return pairs;
};


export default function OperatorControlPanel({ job, onBackToList, refetchJob, disableAllControls }: OperatorControlPanelProps) {
  const { user, isLoading } = useAuth(); // Obtener el usuario y el estado de carga del contexto
  const [isJobStarted, setIsJobStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPuestaPunto, setIsPuestaPunto] = useState(false);
  const [paradaCause, setParadaCause] = useState('');
  const [openConfirmation, setOpenConfirmation] = useState(false);
  const [openGeneralPauseConfirmation, setOpenGeneralPauseConfirmation] = useState(false);
  const [velocidadConfigurada, setVelocidadConfigurada] = useState('');

  const [horaInicio, setHoraInicio] = useState<Date | null>(null);
  const [horaFinal, setHoraFinal] = useState<Date | null>(null);
  const [isTirajeActive, setIsTirajeActive] = useState(false);
  const [pauseCauses, setPauseCauses] = useState<PauseCause[]>([]);
  const [operatorComments, setOperatorComments] = useState<string>('');
  const [puestaPuntoHistory, setPuestaPuntoHistory] = useState<{ start: Date | null; end: Date | null }[]>([]);
  const [resetSetupChronometer, setResetSetupChronometer] = useState(false);
  const [pauseHistory, setPauseHistory] = useState<{ start: Date | null; end: Date | null; cause?: string }[]>([]);
  const [mainChronometerInitialTime, setMainChronometerInitialTime] = useState(0);

  const [isSpeedDirty, setIsSpeedDirty] = useState(false);
  const [isCommentsDirty, setIsCommentsDirty] = useState(false);

  const commentsRef = useRef<HTMLInputElement>(null);
  const speedRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (isLoading) return; // No hacer nada si la autenticación está cargando

    const fetchPauseCauses = async () => {
      try {
        const causes = await getPauseCauses();
        setPauseCauses(causes);
      } catch (error) {
        console.error("Failed to fetch pause causes:", error);
      }
    };
    fetchPauseCauses();
  }, [isLoading]); // Depender de isLoading

  // Efecto solo para sincronizar la velocidad
  useEffect(() => {
    if (job && !isSpeedDirty) {
      setVelocidadConfigurada(job.machineSpeed || '');
    }
  }, [job?.machineSpeed, isSpeedDirty]);

  // Efecto solo para sincronizar los comentarios
  useEffect(() => {
    if (job && !isCommentsDirty) {
      setOperatorComments(job.operatorComments || '');
    }
  }, [job?.operatorComments, isCommentsDirty]);


  useEffect(() => {
    if (!job || !job.timeline) return;

    let currentIsJobStarted = false;
    let currentIsPaused = false;
    let currentIsPuestaPunto = false;
    let currentHoraInicio: Date | null = null;
    let currentHoraFinal: Date | null = null;
    let lastPauseType = '';

    const sortedTimeline = [...job.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const firstProductionStartEvent = sortedTimeline.find(event => event.type === TimelineEventType.PRODUCTION_START);
    if (firstProductionStartEvent) {
      currentHoraInicio = new Date(firstProductionStartEvent.timestamp);
      currentIsJobStarted = true; // Job has started at some point
    }

    const lastProductionEndEvent = sortedTimeline.filter(event => event.type === TimelineEventType.PRODUCTION_END).pop();
    if (lastProductionEndEvent) {
      currentHoraFinal = new Date(lastProductionEndEvent.timestamp);
      currentIsJobStarted = false; // Job is considered not started if it has ended
    }
    
    // Determine current state based on the latest events, ignoring overall start/end for active state
    let lastProductionStart: Date | null = null;
    let lastProductionEnd: Date | null = null;
    let lastPauseStart: Date | null = null;
    let lastPauseEnd: Date | null = null;
    let lastSetupStart: Date | null = null;
    let lastSetupEnd: Date | null = null;

    sortedTimeline.forEach((event: any) => {
      const timestamp = new Date(event.timestamp);
      switch (event.type) {
        case TimelineEventType.PRODUCTION_START:
          lastProductionStart = timestamp;
          break;
        case TimelineEventType.PRODUCTION_END:
          lastProductionEnd = timestamp;
          break;
        case TimelineEventType.PAUSE_START:
          lastPauseStart = timestamp;
          lastPauseType = event.details?.cause || '';
          break;
        case TimelineEventType.PAUSE_END:
          lastPauseEnd = timestamp;
          lastPauseType = '';
          break;
        case TimelineEventType.SETUP_START:
          lastSetupStart = timestamp;
          break;
        case TimelineEventType.SETUP_END:
          lastSetupEnd = timestamp;
          break;
      }
    });

    // Determine current active states
    if (lastProductionStart && lastProductionEnd) {
      currentIsJobStarted = (lastProductionStart as Date).getTime() > (lastProductionEnd as Date).getTime();
    } else if (lastProductionStart && !lastProductionEnd) {
      currentIsJobStarted = true;
    } else {
      currentIsJobStarted = false;
    }

    if (lastPauseStart && lastPauseEnd) {
      currentIsPaused = (lastPauseStart as Date).getTime() > (lastPauseEnd as Date).getTime();
    } else if (lastPauseStart && !lastPauseEnd) {
      currentIsPaused = true;
    } else {
      currentIsPaused = false;
    }

    if (lastSetupStart && lastSetupEnd) {
      currentIsPuestaPunto = (lastSetupStart as Date).getTime() > (lastSetupEnd as Date).getTime();
    } else if (lastSetupStart && !lastSetupEnd) {
      currentIsPuestaPunto = true;
    } else {
      currentIsPuestaPunto = false;
    }

    // Calculate initial chronometer time
    let totalProductionDuration = 0;
    if (currentHoraInicio) { // Use the overall first production start
      const end = currentIsJobStarted ? new Date() : currentHoraFinal || new Date(); // If currently running, use now, else overall end
      totalProductionDuration = (end.getTime() - currentHoraInicio.getTime()) / 1000;
    }

    const initialTime = totalProductionDuration - (job.totalPauseTime || 0);
    setMainChronometerInitialTime(initialTime < 0 ? 0 : initialTime);

    // Set all other states
    setIsJobStarted(currentIsJobStarted);
    setIsPaused(currentIsPaused);
    setIsPuestaPunto(currentIsPuestaPunto);
    setHoraInicio(currentHoraInicio);
    setHoraFinal(currentHoraFinal);
    setIsTirajeActive(currentIsJobStarted || currentIsPaused || currentIsPuestaPunto); // Should be true if job has started and not finished
    setParadaCause(lastPauseType);

    setPuestaPuntoHistory(getEventPairs(job.timeline, TimelineEventType.SETUP_START, TimelineEventType.SETUP_END));
    setPauseHistory(getEventPairs(job.timeline, TimelineEventType.PAUSE_START, TimelineEventType.PAUSE_END));

  }, [job]);

  useEffect(() => {
    // Only refetch if the job is actively 'en curso'
    if (job?.status === 'en_curso') {
      const interval = setInterval(() => {
        refetchJob();
      }, 5000); // Refetch every 5 seconds to keep chronometers and states in sync

      return () => clearInterval(interval);
    }
  }, [job?.status, refetchJob]);


  const handleTimelineEvent = async (type: TimelineEventType, details?: Record<string, any>) => {
    try {
      await addTimelineEvent(job._id, {
        timestamp: new Date(),
        type,
        details,
      });
      await refetchJob(); // Ensure data is fresh after any event
    } catch (error) {
      console.error(`Failed to add timeline event ${type}:`, error);
    }
  };
  
  const handleStartJob = async () => {
    if (!user) {
      console.error("Cannot start job, user is not authenticated.");
      return;
    }
    try {
      await updateJob(job._id, {
        status: 'en_curso',
        operatorComments,
        machineSpeed: velocidadConfigurada,
        startedByUserId: user.id // Capture the user ID here
      });
      await handleTimelineEvent(TimelineEventType.PRODUCTION_START);
    } catch (error) {
      console.error("Failed to start job:", error);
    }
  };

  const handleStop = async () => {
    if (paradaCause) {
      try {
        await updateJob(job._id, { status: 'pausado' });
        await handleTimelineEvent(TimelineEventType.PAUSE_START, { cause: paradaCause });
      } catch (error) {
        console.error("Failed to stop job:", error);
      }
    }
  };

  const handleGeneralPauseClick = () => {
    setOpenGeneralPauseConfirmation(true);
  };

  const handleConfirmGeneralPause = async () => {
    setOpenGeneralPauseConfirmation(false);
    try {
      await updateJob(job._id, { status: 'pausado' });
      await handleTimelineEvent(TimelineEventType.PAUSE_START, { cause: 'Pausa general' });
    } catch (error) {
      console.error("Failed to apply general pause:", error);
    }
  };

  const handleResume = async () => {
    try {
      await updateJob(job._id, { status: 'en_curso' });
      await handleTimelineEvent(TimelineEventType.PAUSE_END);
      setParadaCause('');
    } catch (error) {
      console.error("Failed to resume job:", error);
    }
  };

  const handleFinishClick = () => {
    setOpenConfirmation(true);
  };

  const handleConfirmFinish = async () => {
    setOpenConfirmation(false);
    try {
      await updateJob(job._id, { 
        status: 'terminado',
        operatorComments,
        machineSpeed: velocidadConfigurada
      });
      await handleTimelineEvent(TimelineEventType.PRODUCTION_END);
    } catch (error) {
        console.error("Failed to finish job:", error);
    }
  };

  const handleCloseConfirmation = () => {
    setOpenConfirmation(false);
  };

  const handleStartPuestaPunto = () => {
    handleTimelineEvent(TimelineEventType.SETUP_START);
  };

  const handleEndPuestaPunto = () => {
    handleTimelineEvent(TimelineEventType.SETUP_END);
    setResetSetupChronometer(true);
  };

  const handleResetSetupChronometer = () => {
    setResetSetupChronometer(false);
  };

  const handleCommentsBlur = async () => {
    if (operatorComments !== job.operatorComments) {
      try {
        await updateJob(job._id, { operatorComments: operatorComments });
        await refetchJob();
        setIsCommentsDirty(false);
      } catch (error) {
        console.error("Failed to save operator comments:", error);
      }
    }
  };

  const handleMachineSpeedBlur = async () => {
    if (velocidadConfigurada !== job.machineSpeed) {
      try {
        await updateJob(job._id, { machineSpeed: velocidadConfigurada });
        await refetchJob();
        setIsSpeedDirty(false);
      } catch (error) {
        console.error("Failed to save machine speed:", error);
      }
    }
  };


  if (isLoading || !user) { // Condición de carga mejorada
    return <Typography>Cargando...</Typography>;
  }

  return (
    <Box sx={{ position: 'relative', pt: 1 }}>
      <Box sx={{ position: 'absolute', top: 0, right: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            icon={<PersonIcon sx={{ color: 'white' }} />}
            label={user.name}
            sx={{ backgroundColor: '#228B22', color: 'white' }}
          />
          <Paper elevation={1} sx={{ px: 1.5, py: 0.5, borderRadius: 2, backgroundColor: 'grey.100' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {job.press}
            </Typography>
          </Paper>
        </Stack>
      </Box>

      {/* ... El resto del JSX se mantiene igual ... */}
      <Button startIcon={<ArrowBackIcon />} onClick={onBackToList} size='small'>
        Volver al listado
      </Button>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        {job.ot} - {job.client} - {job.jobType}
        <Divider sx={{ my: 2 }} />
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', mb: 2 }}>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
          <TextField
            id="machine-speed-input"
            inputRef={speedRef}
            label="Velocidad Conf."
            type="number"
            value={velocidadConfigurada}
            onChange={(e) => {
              setVelocidadConfigurada(e.target.value);
              setIsSpeedDirty(true);
            }}
            onBlur={handleMachineSpeedBlur}
            disabled={(job.status === 'terminado') || disableAllControls}
            fullWidth
            size="small"
          />
        </Box>
        <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
          <TextField
            label="Cantidad de Tiraje"
            value={job.quantityPlanned || 'N/A'}
            fullWidth
            variant="outlined"
            size="small"
            InputProps={{ readOnly: true }}
          />
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 0, my: 4, position: 'relative' }}>
        <Typography variant="h4" align="center" gutterBottom>Tiempo de Tiraje</Typography>
        <Stack direction="row" spacing={4} justifyContent="center" alignItems="center">
          {!isJobStarted ? (
            <Fab variant="extended" color="primary" onClick={handleStartJob} sx={{ fontSize: '1.0rem', px: 4, py: 3 }} disabled={(job.status === 'terminado') || disableAllControls}>
              Iniciar
            </Fab>
          ) : isPaused ? (
              <Fab variant="extended" color="primary" onClick={handleResume} sx={{ fontSize: '1.0rem', px: 4, py: 3 }} disabled={(job.status === 'terminado') || disableAllControls}>
                Reanudar
              </Fab>
            ) : (
              <Fab variant="extended" color="warning" onClick={handleGeneralPauseClick} disabled={!isJobStarted || (job.status === 'terminado') || disableAllControls} sx={{ fontSize: '1.odrem', px: 4, py: 3 }}>
                Pausar
              </Fab>
            )}
          <AccessTimeIcon sx={{ fontSize: 80, color: (job.status === 'en_curso') ? 'inherit' : 'text.disabled' }} />
          <OperatorChronometer
            running={job.status === 'en_curso'}
            initialElapsedTime={mainChronometerInitialTime}
          />
          <Fab variant="extended" color="error" onClick={handleFinishClick} disabled={!isJobStarted || (job.status === 'terminado') || disableAllControls} sx={{ fontSize: '1.0rem', px: 4, py: 3 }}>
            Finalizar
          </Fab>
        </Stack>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
          {horaInicio && <Typography variant="body1">Hora Inicio: {horaInicio.toLocaleTimeString()}</Typography>}
          {horaFinal && <Typography variant="body1">Hora Final: {horaFinal.toLocaleTimeString()}</Typography>}
        </Stack>
        
        <Stack spacing={1} sx={{ mt: 4, mx: 'auto', width: '55%' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'inline-block', mb: 0.5 }}>
              Comentarios del Supervisor
            </Typography>
            <Paper variant="elevation" sx={{ p: 1, minHeight: '40px' }}>
                <Typography variant="body2">
                    {job.comments || 'No hay comentarios.'}
                </Typography>
            </Paper>
          </Box>
          <TextField
              id="operator-comments-input"
              name="operator-comments"
              inputRef={commentsRef}
              label="Comentarios del Operador"
              multiline
              rows={1}
              fullWidth
              value={operatorComments}
              onChange={(e) => {
                setOperatorComments(e.target.value);
                setIsCommentsDirty(true);
              }}
              onBlur={handleCommentsBlur}
              disabled={(job.status === 'terminado') || disableAllControls}
              variant="standard"
              size="small"
          />
        </Stack>
      </Paper>
      <Divider sx={{ my: 0 }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: '100%', mx: 'auto', mt: 2 }}>
        <Box sx={{ width: { xs: '100%', md: '45%' } }}>
          <Card sx={{ height: '100%' }} elevation={0}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Puesta a Punto
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={handleStartPuestaPunto}
                  disabled={!isTirajeActive || isPuestaPunto || isPaused || (job.status === 'terminado') || disableAllControls}
                >
                  Iniciar
                </Button>
                <OperatorChronometer
                  running={isPuestaPunto && !isPaused && (job.status !== 'terminado') && !disableAllControls}
                  initialElapsedTime={job.totalSetupTime || 0}
                  reset={resetSetupChronometer}
                  onReset={handleResetSetupChronometer}
                />
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleEndPuestaPunto}
                  disabled={!isPuestaPunto || isPaused || (job.status === 'terminado') || disableAllControls}
                >
                  Finalizar
                </Button>
              </Stack>
              <Box sx={{ mt: 1, textAlign: 'center' }}>
                <Typography variant="subtitle1" component="h3" gutterBottom>
                  Historial de Puesta a Punto
                </Typography>
                <Paper elevation={0} sx={{ p: 1, display: 'inline-block' }}>
                  <List dense>
                    {puestaPuntoHistory.length > 0 ? (
                      puestaPuntoHistory.map((entry, index) => (
                        <ListItem key={index} disableGutters sx={{ py: 0.5, textAlign: 'center' }}>
                          <ListItemText
                            primary={`${entry.start ? entry.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'} - ${entry.end ? entry.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'}) : 'En curso'}`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem disableGutters sx={{ py: 0.5, textAlign: 'center' }}>
                        <ListItemText primary="No hay registros de puesta a punto." />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Box>
              
        <Box sx={{ width: { xs: '100%', md: '50%' } }}>
          <Card sx={{ height: '100%'}} elevation={0}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h5" component="h2" gutterBottom align="center">
                Pausas
              </Typography>
              <Stack width={'90%'} direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center" justifyContent="center">
                <FormControl sx={{ width: '60%' }} disabled={!isTirajeActive || isPaused || (job.status === 'terminado') || disableAllControls}>
                  <InputLabel size='small' id="parada-select-label">Causa de la Pausa</InputLabel>
                  <Select size='small'
                    labelId="parada-select-label"
                    id="causa-pausa-select"
                    name="causa-pausa"
                    value={paradaCause}
                    label="Causa de la Pausa"
                    onChange={(e) => setParadaCause(e.target.value)}
                    disabled={!isTirajeActive || isPaused || (job.status === 'terminado') || disableAllControls}
                  >
                    <MenuItem value=""><em>Seleccione una causa</em></MenuItem>
                    {pauseCauses.map((cause) => (
                      <MenuItem key={cause._id} value={cause.name}>{cause.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  onClick={handleStop}
                  disabled={!isTirajeActive || !paradaCause || isPaused || (job.status === 'terminado') || disableAllControls}
                >
                  Pausar
                </Button>
              </Stack>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle1" component="h3" gutterBottom>
                  Historial de Pausas
                </Typography>
                <Paper elevation={0} sx={{ p: 1, display: 'inline-block' }}>
                  <List dense>
                    {pauseHistory.length > 0 ? (
                      pauseHistory.map((entry, index) => (
                        <ListItem key={index} disableGutters sx={{ py: 0.5, textAlign: 'center' }}>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                  <Typography variant="body2">
                                    {`${entry.start ? entry.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'} - ${entry.end ? entry.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'En curso'}`}
                                  </Typography>
                                  {entry.cause && <Chip label={entry.cause} size="small" />}
                                </Stack>
                              }
                            />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem disableGutters sx={{ py: 0.5, textAlign: 'center' }}>
                        <ListItemText primary="No hay registros de pausas." />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>        <ConfirmationDialog
        open={openConfirmation}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmFinish}
        title="Confirmar Finalización"
        description="¿Está seguro de que desea finalizar la orden de trabajo? Una vez finalizada, no podrá editarla."
      />
      <ConfirmationDialog
        open={openGeneralPauseConfirmation}
        onClose={() => setOpenGeneralPauseConfirmation(false)}
        onConfirm={handleConfirmGeneralPause}
        title="Confirmar Pausa General"
        description="Esto registrará una pausa sin una causa específica. ¿Desea continuar?"
      />
    </Box>
  );
}