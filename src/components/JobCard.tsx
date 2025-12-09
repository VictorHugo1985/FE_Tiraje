// src/components/JobCard.tsx
'use client';

import { Card, CardContent, Typography, Box, Chip, IconButton, Stack, Divider } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import RestoreIcon from '@mui/icons-material/Restore';
import JobCardChronometer from './JobCardChronometer';
import { Job, TimelineEventType } from '../services/api';
import { getDisplayStatus } from '../utils/statusMappers'; // Import getDisplayStatus

interface JobCardProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onCancel?: (job: Job) => void;
  onReestablish?: (job: Job) => void;
  cardBackgroundColor?: string | null;
}

export default function JobCard({ job, onEdit, onCancel, onReestablish, cardBackgroundColor }: JobCardProps) {
  const { ot, press, client, status, jobType, quantityPlanned, checklist, isCancelled, createdAt, timeline, finishedAt, operatorComments, totalPauseTime, setupCount, pauseCount, priority } = job;
  
  // Determine color directly based on status
  let statusColor: "success" | "warning" | "default" | "info" | "error" = 'default';
  if (status === 'en_curso') statusColor = 'success';
  else if (status === 'pausado') statusColor = 'warning';
  else if (status === 'terminado') statusColor = 'info';
  else if (status === 'cancelado') statusColor = 'error';

  const formattedDate = new Date(createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

  const formatTimeHHMM = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "00h 00m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
  };

  // Calculate chronometered production time for finished jobs
  let chronometeredTimeDisplay = '';
  if (status === 'terminado' && timeline) {
    const sortedTimeline = [...timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const firstProductionStartEvent = sortedTimeline.find(event => event.type === TimelineEventType.PRODUCTION_START);
    const lastProductionEndEvent = sortedTimeline.filter(event => event.type === TimelineEventType.PRODUCTION_END).pop();

    if (firstProductionStartEvent && lastProductionEndEvent) {
      const firstStartTimestamp = new Date(firstProductionStartEvent.timestamp).getTime();
      const lastEndTimestamp = new Date(lastProductionEndEvent.timestamp).getTime();
      
      let totalProductionDuration = (lastEndTimestamp - firstStartTimestamp) / 1000; // in seconds

      const effectiveProductionTime = totalProductionDuration - (totalPauseTime || 0);
      chronometeredTimeDisplay = formatTimeHHMM(effectiveProductionTime);
    }
  }

  // Calculate startTime from timeline
  const jobStartTime = timeline
    ?.filter(event => event.type === TimelineEventType.PRODUCTION_START)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) // Get latest start
    .map(event => new Date(event.timestamp))[0] || null;

  return (
    <Card sx={{
      position: 'relative',
      backgroundColor: cardBackgroundColor || (isCancelled ? 'rgba(255, 99, 71, 0.3)' : 'rgba(255, 255, 255, 0.7)'),
      opacity: isCancelled ? 0.7 : 1,
      textDecoration: isCancelled ? 'line-through' : 'none'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" component="div" sx={{ fontWeight: 'bold' }}>
              {jobType}
            </Typography>
            <Typography color="text.secondary" variant="body2">
               {ot} | {client}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {press} | Tiraje: {quantityPlanned}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Creada: {formattedDate}
            </Typography>
            {status === 'terminado' && finishedAt && (
              <>
                <Typography variant="caption" color="text.secondary">
                  Terminada: {new Date(finishedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })} {new Date(finishedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                {chronometeredTimeDisplay && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Tiempo de Tiraje: {chronometeredTimeDisplay}
                  </Typography>
                )}
                {operatorComments && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Comentarios: {operatorComments}
                  </Typography>
                )}
                {typeof pauseCount === 'number' && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Pausas Realizadas: {pauseCount}
                  </Typography>
                )}
                {typeof setupCount === 'number' && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Setups Realizados: {setupCount}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Stack alignItems="flex-end" spacing={0.5}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip label={isCancelled ? 'Cancelada' : getDisplayStatus(status)} color={isCancelled ? 'error' : statusColor} size="small" sx={{ mt: 0.5 }} />
              {typeof priority === 'number' && priority >= 0 && status === 'en_cola' && (
                <Chip
                  label={`#${priority === 0 ? priority + 1 : priority}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5 }}
                />
              )}
            </Stack>
            {status === 'en_curso' && jobStartTime && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                <JobCardChronometer running={status === 'en_curso'} startTime={jobStartTime} variant="body2" sx={{ color: 'text.secondary' }}/>
              </Box>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{fontWeight: 'medium'}}>Espec.:</Typography>
                {checklist?.pantone && <Chip label="Pantone" size="small" variant="outlined" />}
                {checklist?.barniz && <Chip label="Barniz" size="small" variant="outlined" />}
                {checklist?.colors && checklist.colors !== 'none' && <Chip label={checklist.colors} size="small" variant="outlined" />}
            </Stack>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onReestablish && isCancelled && (
                <IconButton
                    aria-label="reestablecer"
                    onClick={() => onReestablish(job)}
                    size="small"
                    color="primary"
                >
                    <RestoreIcon fontSize="inherit" />
                </IconButton>
                )}
                {onCancel && !isCancelled && (
                <IconButton
                    aria-label="cancel"
                    onClick={() => onCancel(job)}
                    size="small"
                    color="warning"
                >
                    <CloseIcon fontSize="inherit" />
                </IconButton>
                )}
                {onEdit && (
                <IconButton
                    aria-label="edit"
                    onClick={() => onEdit(job)}
                    size="small"
                    disabled={isCancelled}
                >
                    <EditIcon fontSize="inherit" />
                </IconButton>
                )}
            </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
