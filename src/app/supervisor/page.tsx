// src/app/supervisor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Container, Button, Stack, Switch, FormControlLabel, CircularProgress, Snackbar, Alert } from '@mui/material';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { JobColumn } from '../../components/JobColumn';
import JobEditor from '../../components/JobEditor';
import { getJobs, createJob, updateJob } from '../../services/api';

// Helper to group jobs by press
const groupJobsByPress = (jobs: any[], presses: string[]) => {
  const grouped: { [key: string]: any[] } = {};
  presses.forEach(press => {
    grouped[press] = jobs.filter(job => job.press === press).sort((a, b) => a.priority - b.priority);
  });
  return grouped;
};

const defaultChecklist = { pantone: false, barniz: false, colors: 'none' };

const pressColumns = ['Prensa 102', 'Prensa 74', 'Prensa 52'];

export default function SupervisorPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [showFinishedJobs, setShowFinishedJobs] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');


  const fetchJobs = async () => {
    try {
      setLoading(true);
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error(error);
      // TODO: Handle error with a user-facing message
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = (id: string) => {
    if (pressColumns.includes(id)) {
      return id;
    }
    const job = jobs.find(j => j.ot === id);
    return job ? job.press : undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const job = jobs.find(j => j.ot === active.id as string);
    // Prevent dragging active/paused jobs to different presses
    if (job && (job.status === 'en_curso' || job.status === 'en_pausa')) {
        // Optionally, provide visual feedback here that it's not draggable to another press
        console.log(`Job ${job.ot} is ${job.status} and cannot be moved to a different press.`);
        setActiveJob(null); // Do not set activeJob if it's not truly draggable across presses
        return;
    }
    setActiveJob(job || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeJob) return; // Also check activeJob to ensure a valid drag operation started
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
  
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Business Rule: OT in 'en_curso' or 'en_pausa' cannot change press
    if (activeJob.status === 'en_curso' || activeJob.status === 'en_pausa') {
        // Here, we effectively stop the visual drag to another container if it's an active job
        // This is mainly for visual feedback during dragOver. The main enforcement is in DragEnd.
        return;
    }

    setJobs(prevJobs => {
        const activeIndex = prevJobs.findIndex(j => j.ot === activeId);
        if (activeIndex !== -1) {
            const updatedJobs = [...prevJobs];
            updatedJobs[activeIndex] = { ...updatedJobs[activeIndex], press: overContainer };
            return updatedJobs;
        }
        return prevJobs;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const currentActiveJob = activeJob; // Use the job that was active at drag start
    setActiveJob(null); // Reset active job

    if (!over || !currentActiveJob) return; // Ensure there's an over target and a job was being dragged
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
  
    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) { // Moved to a different column (press)
        // Business Rule: OT in 'en_curso' or 'en_pausa' cannot change press
        if (currentActiveJob.status === 'en_curso' || currentActiveJob.status === 'en_pausa') {
            console.warn(`Job ${currentActiveJob.ot} is ${currentActiveJob.status} and cannot be moved to a different press. Reverting...`);
            setSnackbarMessage(`La OT ${currentActiveJob.ot} está ${currentActiveJob.status} y no puede ser movida de prensa.`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            fetchJobs(); // Revert optimistic update and re-fetch for consistency
            return;
        }
        
        // Check if the target press already has an active/paused job
        const targetPressJobs = jobs.filter(j => j.press === overContainer && (j.status === 'en_curso' || j.status === 'en_pausa'));
        if (targetPressJobs.length > 0) {
            console.warn(`Prensa ${overContainer} already has an active or paused job. Cannot move ${currentActiveJob.ot}. Reverting...`);
            setSnackbarMessage(`La Prensa ${overContainer} ya tiene una OT activa o en pausa. No se puede mover ${currentActiveJob.ot}.`);
            setSnackbarSeverity('warning');
            setSnackbarOpen(true);
            fetchJobs(); // Revert optimistic update
            return;
        }


        const updatedJob = { ...currentActiveJob, press: overContainer };
        try {
            await updateJob(currentActiveJob._id, updatedJob);
             fetchJobs(); // Re-fetch for consistency
        } catch (error: any) {
            console.error("Failed to update job press", error);
            setSnackbarMessage(error.message || "Error al actualizar la prensa de la OT.");
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            fetchJobs(); // Revert optimistic update
        }
    } else { // Reordered in the same column
        const jobsInColumn = groupJobsByPress(jobs, pressColumns)[activeContainer];
        const oldIndex = jobsInColumn.findIndex((item) => item.ot === activeId);
        const newIndex = jobsInColumn.findIndex((item) => item.ot === overId);

        if (oldIndex !== newIndex) {
            const newSortedItems = arrayMove(jobsInColumn, oldIndex, newIndex);
            const updatePromises = newSortedItems.map((job, index) => 
                updateJob(job._id, { ...job, priority: index })
            );
            try {
                await Promise.all(updatePromises);
                fetchJobs();
            } catch (error: any) {
                console.error("Failed to update job priorities", error);
                setSnackbarMessage(error.message || "Error al actualizar la prioridad de la OT.");
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                fetchJobs();
            }
        }
    }
  };
  
  const handleOpenModal = (job: any | null) => {
    setEditingJob(job ? job : {
        ot: '', client: '', jobType: '', press: pressColumns[0], status: 'en_cola', quantity: '', comments: '', checklist: defaultChecklist,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSaveJob = async (jobToSave: any) => {
    try {
        console.log('handleSaveJob - jobToSave:', jobToSave); // Debug log
        if (jobToSave._id) { // Update
            await updateJob(jobToSave._id, jobToSave);
            setSnackbarMessage('OT actualizada exitosamente!');
            setSnackbarSeverity('success');
        } else { // Create
            await createJob(jobToSave);
            setSnackbarMessage('OT creada exitosamente!');
            setSnackbarSeverity('success');
        }
        setSnackbarOpen(true);
        fetchJobs();
    } catch (error: any) {
        console.error("Failed to save job", error);
        setSnackbarMessage(error.message || "Error al guardar la OT.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
    handleCloseModal();
  };

  const handleCancelJob = async (jobToCancel: any) => {
    try {
        await updateJob(jobToCancel._id, { ...jobToCancel, isCancelled: true });
        setSnackbarMessage('OT cancelada exitosamente!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchJobs();
    } catch (error: any) {
        console.error("Failed to cancel job", error);
        setSnackbarMessage(error.message || "Error al cancelar la OT.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
  };

  const handleReestablishJob = async (jobToReestablish: any) => {
    try {
        await updateJob(jobToReestablish._id, { ...jobToReestablish, isCancelled: false, status: 'en_cola' });
        setSnackbarMessage('OT restablecida exitosamente!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchJobs();
    } catch (error: any) {
        console.error("Failed to re-establish job", error);
        setSnackbarMessage(error.message || "Error al restablecer la OT.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const filteredJobs = jobs.filter(job => {
    if (showFinishedJobs) {
      return job.status === 'terminado' || job.isCancelled;
    }
    return job.status !== 'terminado' && !job.isCancelled;
  });
  const filteredJobsByPress = groupJobsByPress(filteredJobs, pressColumns);

  return (
    <Container maxWidth={false} sx={{ maxWidth: '95vw' }}>
      <Box sx={{ my: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            Planificacion de Produccion
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
                control={<Switch checked={showFinishedJobs} onChange={(e) => setShowFinishedJobs(e.target.checked)} />}
                label="Ver Terminadas/Canceladas"
            />
            <Button variant="contained" onClick={() => handleOpenModal(null)}>
              Crear Nueva OT
            </Button>
          </Stack>
        </Stack>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Arrastre para reordenar o mover entre prensas.
        </Typography>
        
        {loading ? <Box sx={{display: 'flex', justifyContent: 'center', mt: 4}}><CircularProgress /></Box> : (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Box sx={{ display: 'flex', gap: '24px', overflowX: 'auto', py: 2, maxWidth: '100%' }}>
                  {pressColumns.map(press => (
                    <Box key={press} sx={{ width: 350, flexShrink: 0 }}>
                      <JobColumn
                        id={press}
                        title={press}
                        jobs={filteredJobsByPress[press] || []}
                        onEditJob={handleOpenModal}
                        onCancelJob={handleCancelJob}
                        onReestablishJob={handleReestablishJob}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>
            </DndContext>
        )}
      </Box>
      <JobEditor
        job={editingJob}
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveJob}
      />
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}