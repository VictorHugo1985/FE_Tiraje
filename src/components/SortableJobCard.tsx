// src/components/SortableJobCard.tsx
'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import JobCard from './JobCard';
import { Box } from '@mui/material';

export function SortableJobCard(props: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <JobCard job={props.job} />
    </Box>
  );
}
