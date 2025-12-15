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
import { getJobs, createJob, updateJob, Job } from '../../services/api';

const customJobSorter = (a: Job, b: Job) => {
  const statusOrder: Record<string, number> = { 'en_curso': 1, 'pausado': 2, 'en_cola': 3 };
  const statusA = statusOrder[a.status] || 99;
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

// Helper to group jobs by press
const groupJobsByPress = (jobs: Job[], presses: string[]) => {
  const grouped: { [key: string]: Job[] } = {};
  presses.forEach(press => {
    grouped[press] = jobs.filter(job => job.press === press).sort(customJobSorter);
  });
  return grouped;
};

const defaultChecklist = { pantone: false, barniz: false, colors: 'none' as "4x0" | "4x4" | "none" };

const pressColumns = ['Prensa 102', 'Prensa 74', 'Prensa 52'];

export default function SupervisorPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Partial<Job> | null>(null);
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
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
  
    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      return;
    }

    setJobs(prevJobs => {
        const activeIndex = prevJobs.findIndex(j => j.ot === activeId);
        if (activeIndex !== -1) {
            const updatedJobs = [...prevJobs];
            const activeJob = updatedJobs[activeIndex];
            
            // Allow reordering within the same column if the job is 'en_cola'
            // or if it's an 'en_curso' or 'en_pausa' job trying to stay in its column
            if (activeJob.press === overContainer && (activeJob.status === 'en_cola' || ['en_curso', 'pausado'].includes(activeJob.status))) {
                // Check if the target press already has an active/paused job
                // This logic is mostly for preventing drops, but keeping it here for consistency
                const targetHasActive = prevJobs.some(j => j.press === overContainer && (j.status === 'en_curso' || j.status === 'pausado'));
                if (targetHasActive && !['en_curso', 'pausado'].includes(activeJob.status)) {
                    // Do not allow moving into a press that already has an active job if the dragged job is not active itself
                    return prevJobs;
                }
                // No change to job.press here, only reordering visual
                return arrayMove(updatedJobs, activeIndex, activeIndex); // visually move to new container
            }
        }
        return prevJobs;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
  
    if (!activeContainer || !overContainer) return;

    const activeJob = jobs.find(j => j.ot === activeId);
    if (!activeJob) return;

    if (activeContainer !== overContainer) { // Moved to a different column (press)
        // Prevent moving between presses
        setSnackbarMessage("No se permite mover OTs entre diferentes prensas.");
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        fetchJobs(); // Revert any optimistic update
        return; 
    } else { // Reordered in the same column
        const jobsInColumnOriginal = jobs.filter(job => job.press === activeContainer); // Capture original state for this column
        const oldIndex = jobsInColumnOriginal.findIndex((item) => item.ot === activeId);
        const newIndex = jobsInColumnOriginal.findIndex((item) => item.ot === overId);

        if (oldIndex !== newIndex) {
            // 1. Calculate the new visual order for jobs in the affected column
            const newSortedJobsInContainer = arrayMove(jobsInColumnOriginal, oldIndex, newIndex);

            // 2. Assign new consecutive priorities only to 'en_cola' jobs
            let priorityCounter = 0;
            const jobsWithNewPriorities = newSortedJobsInContainer.map(job => {
                if (job.status === 'en_cola') {
                    // Only update priority if it's 'en_cola'
                    return { ...job, priority: priorityCounter++ };
                }
                return job; // Retain original priority for other statuses
            });

            // 3. Prepare promises for jobs whose priorities have changed
            const updatePromises = jobsWithNewPriorities.map(newJob => {
                const originalJob = jobsInColumnOriginal.find(j => j.ot === newJob.ot);
                // Only send update if the job exists, is 'en_cola', and its priority has actually changed
                // (Non-'en_cola' jobs are not expected to have their priority changed by drag and drop)
                if (newJob.status === 'en_cola' && originalJob && originalJob.priority !== newJob.priority) {
                    return updateJob(newJob._id, { priority: newJob.priority });
                }
                return null;
            }).filter(Boolean);

            try {
                // 4. Optimistically update the local state
                setJobs(currentJobs => {
                    const otherJobs = currentJobs.filter(job => job.press !== activeContainer);
                    // Combine with other jobs and re-sort the entire list
                    return [...otherJobs, ...jobsWithNewPriorities].sort(customJobSorter);
                });

                // 5. Execute backend updates
                if (updatePromises.length > 0) {
                    await Promise.all(updatePromises);
                }
                fetchJobs(); // Temporarily re-introduce full fetch to diagnose priority issue
                setSnackbarMessage('Prioridad de OTs actualizada.');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
            } catch (error: any) {
                console.error("Failed to update job priorities", error);
                setSnackbarMessage(error.message || "Error al actualizar la prioridad de la OT.");
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                fetchJobs(); // Revert optimistic update by refetching actual state
            }
        }
    }
  };
  
  const handleOpenModal = (job: Job | null) => {
    setEditingJob(job ? job : {
        ot: '', client: '', jobType: '', press: pressColumns[0], status: 'en_cola', quantityPlanned: '', checklist: defaultChecklist,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleSaveJob = async (jobToSave: Partial<Job>) => {
    try {
        if (jobToSave._id) { // Update
            await updateJob(jobToSave._id, jobToSave);
            setSnackbarMessage('OT actualizada exitosamente!');
            setSnackbarSeverity('success');
        } else { // Create
            // Calculate next priority
            const jobsInPress = jobs.filter(j => j.press === jobToSave.press && j.status === 'en_cola');
            const maxPriority = jobsInPress.reduce((max, j) => Math.max(max, j.priority), -1);
            jobToSave.priority = maxPriority + 1;

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

  const handleCancelJob = async (jobToCancel: Job) => {
    try {
        // Optimistically update the UI
        setJobs(currentJobs =>
            currentJobs.map(job =>
                job._id === jobToCancel._id ? { ...job, status: 'cancelado', isCancelled: true } : job
            )
        );

        await updateJob(jobToCancel._id, { status: 'cancelado' });

        setSnackbarMessage('OT cancelada exitosamente!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        // Re-fetch to ensure consistency, though the optimistic update should handle the immediate UI change
        fetchJobs();
    } catch (error: any) {
        console.error("Failed to cancel job", error);
        // Revert the optimistic update on error
        fetchJobs();
        setSnackbarMessage(error.message || "Error al cancelar la OT.");
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
    }
  };

  const handleReestablishJob = async (jobToReestablish: Job) => {
    try {
        // Optimistically update the UI
        setJobs(currentJobs =>
            currentJobs.map(job =>
                job._id === jobToReestablish._id ? { ...job, status: 'en_cola', isCancelled: false } : job
            )
        );

        await updateJob(jobToReestablish._id, { status: 'en_cola', isCancelled: false });

        setSnackbarMessage('OT restablecida exitosamente!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        fetchJobs();
    } catch (error: any) {
        console.error("Failed to re-establish job", error);
        fetchJobs(); // Revert on error
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
            Planificacion Prensas
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
                control={<Switch checked={showFinishedJobs} onChange={(e) => setShowFinishedJobs(e.target.checked)} />}
                label="Ver Ocultas"
            />
            <Button variant="contained" onClick={() => handleOpenModal(null)}>
              Nueva OT
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
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, justifyContent: 'center' }}>
                {pressColumns.map(press => (
                  <Box key={press} sx={{ flexGrow: 1, width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)' } }}>
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