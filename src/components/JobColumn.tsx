// src/components/JobColumn.tsx
'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Box, Typography, Paper } from '@mui/material';
import { SortableJobCard } from './SortableJobCard';
import { Job } from '../services/api';

interface JobColumnProps {
  id: string;
  title: string;
  jobs: Job[];
  onEditJob: (job: Job) => void;
  onCancelJob: (job: Job) => void;
  onReestablishJob: (job: Job) => void;
}

export function JobColumn({ id, title, jobs, onEditJob, onCancelJob, onReestablishJob }: JobColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Paper sx={{ p: 2, backgroundColor: '#f4f6f8', height: '100%', minHeight: 500 }}>
      <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', mb: 2 }}>
        {title}
      </Typography>
      <SortableContext items={jobs.map(j => j.ot)} strategy={verticalListSortingStrategy}>
        <Box ref={setNodeRef} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {jobs.map(job => (
            <SortableJobCard 
              key={job.ot} 
              job={job} 
              onEditJob={onEditJob} 
              onCancelJob={onCancelJob} 
              onReestablishJob={onReestablishJob}
              disabled={job.status === 'en_curso' || job.status === 'pausado'}
            />
          ))}
        </Box>
      </SortableContext>
    </Paper>
  );
}
