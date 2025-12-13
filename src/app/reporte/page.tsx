// src/app/reporte/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, FormControl, InputLabel, Stack, Select, Button, Menu, Checkbox, ListItemIcon
} from '@mui/material';
import { getJobs, Job } from '../../services/api';
import * as XLSX from 'xlsx';

export default function ReportePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pressFilter, setPressFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    ot: true,
    client: true,
    press: true,
    jobType: true,
    machineSpeed: true,
    pantone: true,
    barniz: true,
    '4x0': true,
    '4x4': true,
    setupCount: true,
    totalSetupTime: true,
    totalPauseTime: true,
    supervisorComments: true,
    operatorComments: true,
    status: true,
    createdAt: true,
    tirajeTime: true,
  });

  const handleColumnVisibilityChange = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(jobs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
    XLSX.writeFile(workbook, "reporte_ots.xlsx");
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Reporte de Ordenes de Trabajo
          </Typography>
          <Button variant="contained" onClick={handleExport}>
            Exportar a Excel
          </Button>
          <Button variant="outlined" onClick={handleMenuOpen}>
            Columnas
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {Object.keys(visibleColumns).map((column) => (
              <MenuItem key={column} onClick={() => handleColumnVisibilityChange(column as keyof typeof visibleColumns)}>
                <Checkbox checked={visibleColumns[column as keyof typeof visibleColumns]} />
                {column}
              </MenuItem>
            ))}
          </Menu>
        </Stack>

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
                  {visibleColumns.ot && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>OT</TableCell>}
                  {visibleColumns.client && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Cliente</TableCell>}
                  {visibleColumns.press && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Prensa</TableCell>}
                  {visibleColumns.jobType && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Tipo de Trabajo</TableCell>}
                  {visibleColumns.machineSpeed && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Velocidad de Máquina</TableCell>}
                  {visibleColumns.pantone && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Pantone</TableCell>}
                  {visibleColumns.barniz && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Barniz</TableCell>}
                  {visibleColumns['4x0'] && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>4x0</TableCell>}
                  {visibleColumns['4x4'] && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>4x4</TableCell>}
                  {visibleColumns.setupCount && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Conteo de Setup</TableCell>}
                  {visibleColumns.totalSetupTime && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Total Setup</TableCell>}
                  {visibleColumns.totalPauseTime && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Total Tiempo Pausa</TableCell>}
                  {visibleColumns.supervisorComments && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Comentarios Supervisor</TableCell>}
                  {visibleColumns.operatorComments && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Comentarios Operador</TableCell>}
                  {visibleColumns.status && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Estado</TableCell>}
                  {visibleColumns.createdAt && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Fecha de Creación</TableCell>}
                  {visibleColumns.tirajeTime && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>Tiempo Total de Tiraje</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job._id}>
                    {visibleColumns.ot && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.ot}</TableCell>}
                    {visibleColumns.client && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.client}</TableCell>}
                    {visibleColumns.press && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.press}</TableCell>}
                    {visibleColumns.jobType && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.jobType}</TableCell>}
                    {visibleColumns.machineSpeed && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.machineSpeed}</TableCell>}
                    {visibleColumns.pantone && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.checklist.pantone ? 'Sí' : 'No'}</TableCell>}
                    {visibleColumns.barniz && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.checklist.barniz ? 'Sí' : 'No'}</TableCell>}
                    {visibleColumns['4x0'] && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.checklist.colors === '4x0' ? 'Sí' : 'No'}</TableCell>}
                    {visibleColumns['4x4'] && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.checklist.colors === '4x4' ? 'Sí' : 'No'}</TableCell>}
                    {visibleColumns.setupCount && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.setupCount}</TableCell>}
                    {visibleColumns.totalSetupTime && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{calculateTotalSetupTime(job)}</TableCell>}
                    {visibleColumns.totalPauseTime && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.totalPauseTime ? `${Math.floor(job.totalPauseTime / 60)}m` : 'N/A'}</TableCell>}
                    {visibleColumns.supervisorComments && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.comments}</TableCell>}
                    {visibleColumns.operatorComments && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.operatorComments}</TableCell>}
                    {visibleColumns.status && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{job.status}</TableCell>}
                    {visibleColumns.createdAt && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{new Date(job.createdAt).toLocaleDateString()}</TableCell>}
                    {visibleColumns.tirajeTime && <TableCell sx={{ fontSize: '0.75rem', padding: '8px' }}>{calculateTirajeTime(job)}</TableCell>}
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

const calculateTotalSetupTime = (job: Job) => {
  if (!job.timeline) {
    return 'N/A';
  }

  const setupEvents = job.timeline.filter(e => e.type === 'setup_start' || e.type === 'setup_end');
  let totalSetupTime = 0;
  let setupStart: Date | null = null;

  for (const event of setupEvents) {
    if (event.type === 'setup_start') {
      setupStart = new Date(event.timestamp);
    } else if (event.type === 'setup_end' && setupStart) {
      const setupEnd = new Date(event.timestamp);
      totalSetupTime += (setupEnd.getTime() - setupStart.getTime()) / 1000; // in seconds
      setupStart = null;
    }
  }

  if (totalSetupTime > 0) {
    const hours = Math.floor(totalSetupTime / 3600);
    const minutes = Math.floor((totalSetupTime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  return 'N/A';
};
