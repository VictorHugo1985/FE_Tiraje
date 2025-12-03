// src/app/colaborador/page.tsx
'use client';

import { Box, Typography, Container, Grid } from '@mui/material';
import JobCard from '../../components/JobCard';

const mockJobs = [
  { id: 'OT-1102', press: 'Prensa 102', client: 'Embol Afiches', status: 'en_curso', priority: 1 },
  { id: 'OT-1103', press: 'Prensa 52', client: 'Cliente B', status: 'en_pausa', priority: 2 },
  { id: 'OT-1104', press: 'Prensa 74', client: 'Honor Diptico', status: 'en_cola', priority: 3 },
  { id: 'OT-1105', press: 'Prensa 74', client: 'Cliente D', status: 'en_curso', priority: 4 },
  { id: 'OT-1106', press: 'Prensa 74', client: 'Cliente E', status: 'en_cola', priority: 5 },
];

export default function ColaboradorPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Monitor de Producción - Colaborador
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {mockJobs.sort((a, b) => a.priority - b.priority).map((job) => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <JobCard job={job} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
