// src/components/SortableJobCard.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import JobCard from './JobCard';
import { Box } from '@mui/material';
import { Job } from '../services/api';

interface SortableJobCardProps {
  job: Job;
  onEditJob: (job: Job) => void;
  onCancelJob: (job: Job) => void;
  onReestablishJob: (job: Job) => void;
  disabled: boolean;
}

export function SortableJobCard({ job, onEditJob, onCancelJob, onReestablishJob, disabled }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.ot, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    cursor: disabled ? 'default' : 'grab',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 'auto',
  };

  return (
    <Box ref={setNodeRef} style={style} {...(disabled ? {} : attributes)} {...(disabled ? {} : listeners)}>
      <JobCard 
        job={job} 
        onEdit={onEditJob} 
        onCancel={onCancelJob} 
        onReestablish={onReestablishJob}
      />
    </Box>
  );
}
