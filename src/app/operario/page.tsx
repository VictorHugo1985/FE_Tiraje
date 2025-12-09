// src/app/operario/page.tsx
// Force recompilation of this file
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, CardActionArea, Button, Stack, CircularProgress } from '@mui/material';

import OperatorControlPanel from '../../components/OperatorControlPanel';
import JobCard from '../../components/JobCard';
import { getJobs, getJobById, Job } from '../../services/api'; // Import Job type and getJobById

// Define press options with associated colors
const pressOptions = [
  { name: 'Prensa 102', value: 'Prensa 102', color: 'primary', lightColor: 'rgba(200, 220, 255, 0.5)' }, // Light blue
  { name: 'Prensa 74', value: 'Prensa 74', color: 'success', lightColor: 'rgba(200, 255, 200, 0.5)' }, // Light green
  { name: 'Prensa 52', value: 'Prensa 52', color: 'error', lightColor: 'rgba(255, 200, 200, 0.5)' }, // Light red
];

const customJobSorter = (a: Job, b: Job) => {
  const statusOrder: Record<string, number> = { 'en_curso': 1, 'pausado': 2, 'en_cola': 3 };

  const statusA = statusOrder[a.status] || 99; // Default to a high number for unknown statuses
  const statusB = statusOrder[b.status] || 99;

  if (statusA !== statusB) {
    return statusA - statusB;
  }

    // If statuses are the same, sort by priority
    if (a.status === b.status) {
      return a.priority - b.priority;
    }
  
    return 0;
  };
export default function OperarioPage() {
  const [allJobs, setAllJobs] = useState<Job[]>([]); // Store all fetched jobs
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]); // Jobs to display based on selection
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [selectedPress, setSelectedPress] = useState<string | null>(null);
  const [selectedPressColor, setSelectedPressColor] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const fetched = await getJobs();
        const operatorRelevantJobs = fetched.filter((j: Job) => ['en_cola', 'en_curso', 'pausado'].includes(j.status));
        setAllJobs(operatorRelevantJobs);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const refetchActiveJob = useCallback(async () => {
    if (activeJob?._id) {
      try {
        const updatedJob = await getJobById(activeJob._id);
        setActiveJob(updatedJob);
      } catch (error) {
        console.error("Failed to refetch active job:", error);
      }
    }
  }, [activeJob]);

  const handleSelectPress = (pressValue: string, lightColor: string) => {
    setSelectedPress(pressValue);
    setSelectedPressColor(lightColor);
    setFilteredJobs(allJobs.filter((j: Job) => j.press === pressValue).sort(customJobSorter));
  };

  const handleSelectJob = (job: Job) => {
    setActiveJob(job);
  };

  const handleBackToList = async () => {
    setActiveJob(null);
    setSelectedPress(null); 
    setSelectedPressColor(null);
    setFilteredJobs([]);
    
    // Refetch all jobs to get the latest state
    try {
      setLoading(true);
      const fetched = await getJobs();
      const operatorRelevantJobs = fetched.filter((j: Job) => ['en_cola', 'en_curso', 'pausado'].includes(j.status));
      setAllJobs(operatorRelevantJobs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (activeJob) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <OperatorControlPanel 
            job={activeJob} 
            onBackToList={handleBackToList} 
            refetchJob={refetchActiveJob} 
            disableAllControls={false} // Controls are managed within the panel
          />
        </Box>
      </Container>
    );
  }

  const hasActiveJobInPress = filteredJobs.some((j: Job) => ['en_curso', 'pausado'].includes(j.status));

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Seleccionar OT
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" mb={4}>
          {pressOptions.map((press) => (
            <Button
              key={press.value}
              variant={selectedPress === press.value ? 'contained' : 'outlined'}
              color={press.color as 'primary' | 'success' | 'error'}
              onClick={() => handleSelectPress(press.value, press.lightColor)}
            >
              {press.name}
            </Button>
          ))}
        </Stack>

        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          {selectedPress ? `Ordenes de Trabajo para ${selectedPress}` : 'Elija una Prensa para ver las Ordenes de Trabajo.'}
        </Typography>

        {loading ? <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}><CircularProgress /></Box> : (
            <Stack direction="row" flexWrap="wrap" spacing={2} useFlexGap sx={{ mt: 2, justifyContent: 'center' }}>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job: Job) => (
                  <Box key={job._id} sx={{ width: 340, flexShrink: 0 }}>
                    <CardActionArea 
                      onClick={() => handleSelectJob(job)} 
                      disabled={hasActiveJobInPress && !['en_curso', 'pausado'].includes(job.status)}
                    >
                      <JobCard job={job} cardBackgroundColor={selectedPressColor} />
                    </CardActionArea>
                  </Box>
                ))
              ) : (
                selectedPress && !loading && (
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="body1" align="center" color="text.secondary">
                            No hay Ordenes de Trabajo para {selectedPress}.
                        </Typography>
                    </Box>
                )
              )}
            </Stack>
        )}
      </Box>
    </Container>
  );
}
