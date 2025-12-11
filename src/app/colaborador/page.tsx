// src/app/colaborador/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Container, Stack, Paper, CircularProgress } from '@mui/material';
import JobCard from '../../components/JobCard';
import { getJobs, TimelineEventType, Job } from '../../services/api';

// Helper to format time in HHh MMm
const formatTimeHHMM = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "00h 00m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`;
};

// Helper to group jobs by press
const groupJobsByPress = (jobs: Job[], presses: string[]) => {
  const grouped: { [key:string]: Job[] } = {};
  presses.forEach(press => {
    grouped[press] = jobs.filter(job => job.press === press).sort((a, b) => a.priority - b.priority);
  });
  return grouped;
};

const pressColumns = ['Prensa 102', 'Prensa 74', 'Prensa 52'];

const FinishedJobCard = ({ job }: { job: Job }) => {
    let chronometeredTimeDisplay = '';
    let operatorName = 'N/A'; // Default value

    if (job.timeline) {
      const sortedTimeline = [...job.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      const firstProductionStartEvent = sortedTimeline.find(event => event.type === TimelineEventType.PRODUCTION_START);
      if (firstProductionStartEvent && firstProductionStartEvent.userId && firstProductionStartEvent.userId.name) {
        operatorName = firstProductionStartEvent.userId.name;
      }

      const lastProductionEndEvent = sortedTimeline.filter(event => event.type === TimelineEventType.PRODUCTION_END).pop();

      if (firstProductionStartEvent && lastProductionEndEvent) {
        const firstStartTimestamp = new Date(firstProductionStartEvent.timestamp).getTime();
        const lastEndTimestamp = new Date(lastProductionEndEvent.timestamp).getTime();
        let totalProductionDuration = (lastEndTimestamp - firstStartTimestamp) / 1000; // in seconds
        const effectiveProductionTime = totalProductionDuration - (job.totalPauseTime || 0);
        chronometeredTimeDisplay = formatTimeHHMM(effectiveProductionTime);
      }
    }

    return (
        <Paper elevation={1} sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }}>
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                    {job.press} | {job.jobType}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'burlywood', fontSize: '0.75rem'}}>
                    {operatorName}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>{job.ot} | {job.client}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                {job.finishedAt ? `Terminada: ${new Date(job.finishedAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} - ${new Date(job.finishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </Typography>
                {chronometeredTimeDisplay && (
                    <Typography variant="caption" color="text.secondary" display="block">
                        Tiempo de Tiraje: {chronometeredTimeDisplay}
                    </Typography>
                )}
                {job.operatorComments && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Comentarios: {job.operatorComments}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

const CurrentTime = () => {
    const [time, setTime] = useState<Date | null>(null); // Initialize with null

    useEffect(() => {
        // Set initial time only on client side
        setTime(new Date()); 
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {time ? `${time.toLocaleDateString()} ${time.toLocaleTimeString()}` : 'Cargando...'}
        </Typography>
    );
};

const customJobSorter = (a: Job, b: Job) => {
  const statusOrder: Record<string, number> = { 'en_curso': 1, 'pausado': 2, 'en_cola': 3 };

  const statusA = statusOrder[a.status] || 99; // Default to a high number for unknown statuses
  const statusB = statusOrder[b.status] || 99;

  if (statusA !== statusB) {
    return statusA - statusB;
  }

  // If statuses are the same and it's 'en_cola', sort by priority
  if (a.status === 'en_cola' && b.status === 'en_cola') {
    return a.priority - b.priority;
  }

  // For 'en_curso' or 'pausado' jobs with the same status, maintain existing order.
  // Or, if a consistent order is desired, sort by createdAt/updatedAt (not specified, so default to 0 for now).
  return 0; 
};

export default function ColaboradorPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
        try {
            const fetchedJobs = await getJobs();
            setJobs(fetchedJobs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const jobsByPress = groupJobsByPress(jobs, pressColumns);

  const activeJobsByPress = pressColumns.reduce((acc, press) => {
    acc[press] = (jobsByPress[press] || []).filter(job => job.status !== 'terminado' && !job.isCancelled);
    return acc;
  }, {} as { [key: string]: Job[] });

  const allFinishedJobs = jobs
    .filter(job => job.status === 'terminado')
    .sort((a,b) => new Date(b.finishedAt!).getTime() - new Date(a.finishedAt!).getTime());

  return (
    <Container maxWidth={false} sx={{ p: '0 !important', m: '0 !important', height: '100vh', overflow: 'hidden', backgroundColor: '#eef2f6' }}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Monitor de Producción
          </Typography>
          <CurrentTime />
        </Stack>

        {loading && jobs.length === 0 ? <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}><CircularProgress /></Box> : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
              {pressColumns.map(press => (
                <Box key={press} sx={{ flexGrow: 1, width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
                    <Paper sx={{ p: 2, backgroundColor: '#f4f6f8', height: '100%' }}>
                        <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
                            {press}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(activeJobsByPress[press] || []).sort(customJobSorter).map(job => (
                                <JobCard key={job.ot} job={job} />
                            ))}
                        </Box>
                    </Paper>
                </Box>
              ))}
              {/* Finished Jobs Column */}
              <Box sx={{ flexGrow: 1, width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
                  <Paper sx={{ p: 2, backgroundColor: '#f4f6f8', height: '100%', maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
                      <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Terminadas
                      </Typography>
                      <Stack spacing={1}>
                          {allFinishedJobs.map(job => (
                              <FinishedJobCard key={job.ot} job={job} />
                          ))}
                      </Stack>
                  </Paper>
              </Box>
            </Box>
        )}
      </Box>
    </Container>
  );
}