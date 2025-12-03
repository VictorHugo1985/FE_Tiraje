// src/components/SortableJobCard.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import JobCard from './JobCard';
import { Box } from '@mui/material';

interface SortableJobCardProps {
  job: any;
  onEditJob: (job: any) => void;
  onCancelJob: (job: any) => void;
  onReestablishJob: (job: any) => void; // New prop
}

export function SortableJobCard({ job, onEditJob, onCancelJob, onReestablishJob }: SortableJobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: job.ot });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard 
        job={job} 
        onEdit={onEditJob} 
        onCancel={onCancelJob} 
        onReestablish={onReestablishJob} // Pass to JobCard
      />
    </Box>
  );
}
