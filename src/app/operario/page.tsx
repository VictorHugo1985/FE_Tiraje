// src/app/operario/page.tsx
'use client';

import { useState } from 'react';
import { Box, Typography, Container, Grid, CardActionArea } from '@mui/material';
import OperatorControlPanel from '../../components/OperatorControlPanel';
import JobCard from '../../components/JobCard';

const mockJobs = [
  { id: 'OT-1102', press: 'Prensa 102', client: 'Cliente A', status: 'en_cola', priority: 1 },
  { id: 'OT-1103', press: 'Prensa 74', client: 'Cliente B', status: 'en_cola', priority: 2 },
  { id: 'OT-1104', press: 'Prensa 52', client: 'Cliente C', status: 'en_cola', priority: 3 },
];

export default function OperarioPage() {
  const [activeJob, setActiveJob] = useState<any | null>(null);

  const handleSelectJob = (job: any) => {
    setActiveJob(job);
  };

  const handleBackToList = () => {
    setActiveJob(null);
  };

  if (activeJob) {
    return (
      <Container maxWidth="md">
        <Box sx={{ my: 4 }}>
          <OperatorControlPanel job={activeJob} onBackToList={handleBackToList} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Seleccionar Orden de Trabajo
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Elija una orden para iniciar el trabajo.
        </Typography>
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {mockJobs.map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <CardActionArea onClick={() => handleSelectJob(job)}>
                <JobCard job={job} />
              </CardActionArea>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
