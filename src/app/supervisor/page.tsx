// src/app/supervisor/page.tsx
// NOTE: This component requires @dnd-kit/core and @dnd-kit/sortable
'use client';

import { useState } from 'react';
import { Box, Typography, Container, Grid } from '@mui/material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableJobCard } from '../../components/SortableJobCard';

const initialJobs = [
  { id: 'OT-1102', press: 'Prensa 1', client: 'Cliente A', status: 'en_curso', priority: 1 },
  { id: 'OT-1103', press: 'Prensa 2', client: 'Cliente B', status: 'en_pausa', priority: 2 },
  { id: 'OT-1104', press: 'Prensa 1', client: 'Cliente C', status: 'en_cola', priority: 3 },
  { id: 'OT-1105', press: 'Prensa 3', client: 'Cliente D', status: 'en_curso', priority: 4 },
  { id: 'OT-1106', press: 'Prensa 2', client: 'Cliente E', status: 'en_cola', priority: 5 },
];

export default function SupervisorPage() {
  const [jobs, setJobs] = useState(initialJobs);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;

    if (active.id !== over.id) {
      setJobs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
          Monitor de Producción - Supervisor
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Arrastre y suelte las tarjetas para reordenar la prioridad.
        </Typography>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={jobs} strategy={verticalListSortingStrategy}>
            <Grid container spacing={3} sx={{ mt: 2 }}>
              {jobs.map((job) => (
                <Grid item xs={12} md={6} lg={4} key={job.id}>
                  <SortableJobCard job={job} />
                </Grid>
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      </Box>
    </Container>
  );
}
