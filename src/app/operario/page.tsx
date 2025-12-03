// src/app/operario/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Grid, CardActionArea, Button, Stack, CircularProgress } from '@mui/material';
import OperatorControlPanel from '../../components/OperatorControlPanel';
import JobCard from '../../components/JobCard';
import { getJobs, getJobById } from '../../services/api'; // Import getJobById

// Define press options with associated colors
const pressOptions = [
  { name: 'Prensa 102', value: 'Prensa 102', color: 'primary', lightColor: 'rgba(200, 220, 255, 0.5)' }, // Light blue
  { name: 'Prensa 74', value: 'Prensa 74', color: 'success', lightColor: 'rgba(200, 255, 200, 0.5)' }, // Light green
  { name: 'Prensa 52', value: 'Prensa 52', color: 'error', lightColor: 'rgba(255, 200, 200, 0.5)' }, // Light red
];

export default function OperarioPage() {
  const [allJobs, setAllJobs] = useState<any[]>([]); // Store all fetched jobs
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]); // Jobs to display based on selection
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [selectedPress, setSelectedPress] = useState<string | null>(null);
  const [selectedPressColor, setSelectedPressColor] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const fetched = await getJobs();
      const operatorRelevantJobs = fetched.filter(j => ['en_cola', 'en_curso', 'en_pausa'].includes(j.status));
      setAllJobs(operatorRelevantJobs);

      // Re-apply filter if a press is already selected
      if (selectedPress) {
        setFilteredJobs(operatorRelevantJobs.filter(j => j.press === selectedPress));
      } else {
        setFilteredJobs([]); // No press selected, no jobs shown initially
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedPress]); // Refetch when selectedPress changes to re-filter immediately

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
    setFilteredJobs(allJobs.filter(j => j.press === pressValue));
  };

  const handleSelectJob = (job: any) => {
    setActiveJob(job);
  };

  const handleBackToList = () => {
    setActiveJob(null);
    setSelectedPress(null); // Clear selected press when going back to list
    setSelectedPressColor(null);
    fetchJobs(); // Refresh the list
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

  const hasActiveJobInPress = filteredJobs.some(j => ['en_curso', 'en_pausa'].includes(j.status));

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Seleccionar Orden de Trabajo
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
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <Grid item xs={12} md={6} lg={4} key={job._id}>
                    <CardActionArea 
                      onClick={() => handleSelectJob(job)} 
                      disabled={hasActiveJobInPress && !['en_curso', 'en_pausa'].includes(job.status)}
                    >
                      <JobCard job={job} cardBackgroundColor={selectedPressColor} />
                    </CardActionArea>
                  </Grid>
                ))
              ) : (
                selectedPress && !loading && (
                    <Grid item xs={12}>
                        <Typography variant="body1" align="center" color="text.secondary">
                            No hay Ordenes de Trabajo para {selectedPress}.
                        </Typography>
                    </Grid>
                )
              )}
            </Grid>
        )}
      </Box>
    </Container>
  );
}
