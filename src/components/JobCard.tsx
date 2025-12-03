// src/components/JobCard.tsx
'use client';

import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import JobCardChronometer from './JobCardChronometer';

interface JobCardProps {
  job: {
    id: string;
    press: string;
    client: string;
    status: 'en_curso' | 'en_pausa' | 'en_cola';
    priority: number;
  };
}

const statusMap = {
  en_curso: { label: 'En Curso', color: 'success' },
  en_pausa: { label: 'En Pausa', color: 'warning' },
  en_cola: { label: 'En Cola', color: 'default' },
};

export default function JobCard({ job }: JobCardProps) {
  const { id, press, client, status } = job;
  const statusInfo = statusMap[status] as { label: string; color: "success" | "warning" | "default" };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" component="div">
              Orden: {id}
            </Typography>
            <Typography sx={{ mb: 1.5 }} color="text.secondary">
              Prensa: {press} | Cliente: {client}
            </Typography>
          </Box>
          <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
        </Box>

        {status === 'en_curso' && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
            <JobCardChronometer running={job.status === 'en_curso'} variant="body2" sx={{ color: 'text.secondary' }}/>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
