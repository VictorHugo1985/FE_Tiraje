// src/app/reporte/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Box, Typography, Container, Paper, CircularProgress, TextField, MenuItem, FormControl, InputLabel, Stack, Select, Button, Checkbox
} from '@mui/material';
import { getJobs, Job } from '../../services/api';
import * as XLSX from 'xlsx';
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';

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
      } catch (error)
 {
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

  const columns = useMemo<MRT_ColumnDef<Job>[]>(
    () => [
      { accessorKey: 'ot', header: 'OT' },
      { accessorKey: 'client', header: 'Cliente' },
      { accessorKey: 'press', header: 'Prensa' },
      { accessorKey: 'jobType', header: 'Tipo de Trabajo' },
      { accessorKey: 'machineSpeed', header: 'Velocidad de Máquina' },
      {
        accessorKey: 'checklist.pantone',
        header: 'Pantone',
        Cell: ({ cell }) => <Checkbox checked={cell.getValue<boolean>()} disabled />,
      },
      {
        accessorKey: 'checklist.barniz',
        header: 'Barniz',
        Cell: ({ cell }) => <Checkbox checked={cell.getValue<boolean>()} disabled />,
      },
      {
        accessorFn: (row) => row.checklist.colors === '4x0',
        id: '4x0',
        header: '4x0',
        Cell: ({ cell }) => <Checkbox checked={cell.getValue<boolean>()} disabled />,
      },
      {
        accessorFn: (row) => row.checklist.colors === '4x4',
        id: '4x4',
        header: '4x4',
        Cell: ({ cell }) => <Checkbox checked={cell.getValue<boolean>()} disabled />,
      },
      { accessorKey: 'setupCount', header: 'Conteo de Setup' },
      {
        id: 'totalSetupTime',
        header: 'Total Setup',
        accessorFn: (row) => calculateTotalSetupTime(row),
      },
      {
        accessorKey: 'totalPauseTime',
        header: 'Total Tiempo Pausa',
        Cell: ({ cell }) => cell.getValue<number>() ? `${Math.floor(cell.getValue<number>() / 60)}m` : 'N/A',
      },
      { accessorKey: 'comments', header: 'Comentarios Supervisor' },
      { accessorKey: 'operatorComments', header: 'Comentarios Operador' },
      { accessorKey: 'status', header: 'Estado' },
      {
        accessorKey: 'createdAt',
        header: 'Fecha de Creación',
        Cell: ({ cell }) => new Date(cell.getValue<Date>()).toLocaleDateString(),
      },
      {
        id: 'tirajeTime',
        header: 'Tiempo Total de Tiraje',
        accessorFn: (row) => calculateTirajeTime(row),
      },
    ],
    [],
  );

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
          <MaterialReactTable
            columns={columns}
            data={jobs}
            enableColumnResizing
            enableColumnOrdering
            enableHiding
            initialState={{ density: 'compact' }}
          />
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
