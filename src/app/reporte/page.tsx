// src/app/reporte/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { getJobs, Job } from '../../services/api';

export default function ReportePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pressFilter, setPressFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const filters: { press?: string, startDate?: string, endDate?: string } = {};
        if (pressFilter) filters.press = pressFilter;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        const fetchedJobs = await getJobs(filters);
        setJobs(fetchedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [pressFilter, startDate, endDate]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Reporte de Ordenes de Trabajo
        </Typography>

        <Stack direction="row" spacing={2} mb={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Prensa</InputLabel>
            <Select
              value={pressFilter}
              label="Prensa"
              onChange={(e) => setPressFilter(e.target.value)}
            >
              <MenuItem value="">
                <em>Todas</em>
              </MenuItem>
              <MenuItem value="Prensa 102">Prensa 102</MenuItem>
              <MenuItem value="Prensa 74">Prensa 74</MenuItem>
              <MenuItem value="Prensa 52">Prensa 52</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Fecha de Inicio"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="Fecha de Fin"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table sx={{ minWidth: 650 }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>OT</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Prensa</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha de Creación</TableCell>
                  <TableCell>Tiempo Total de Tiraje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell>{job.ot}</TableCell>
                    <TableCell>{job.client}</TableCell>
                    <TableCell>{job.press}</TableCell>
                    <TableCell>{job.status}</TableCell>
                    <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{calculateTirajeTime(job)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

const calculateTirajeTime = (job: Job) => {
  if (job.status !== 'terminado' || !job.timeline) {
    return 'N/A';
  }

  const productionStart = job.timeline.find(e => e.type === 'production_start');
  const productionEnd = job.timeline.find(e => e.type === 'production_end');

  if (productionStart && productionEnd) {
    const startTime = new Date(productionStart.timestamp).getTime();
    const endTime = new Date(productionEnd.timestamp).getTime();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    const tirajeTime = totalTime - (job.totalPauseTime || 0);

    const hours = Math.floor(tirajeTime / 3600);
    const minutes = Math.floor((tirajeTime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  return 'N/A';
};
