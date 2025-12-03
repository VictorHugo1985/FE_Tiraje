// src/components/JobCardChronometer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Typography, TypographyProps, SxProps, Theme } from '@mui/material';

interface ChronometerProps {
  running: boolean;
  startTime?: Date | null; // New prop
  variant?: TypographyProps['variant'];
  sx?: SxProps<Theme>;
}

const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
};

export default function JobCardChronometer({ running, startTime = null, variant = 'body2', sx }: ChronometerProps) { // Default variant changed to body2
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (running && startTime) {
      const startTimestamp = startTime.getTime();
      const calculateElapsedTime = () => {
        setElapsedTime(Math.floor((Date.now() - startTimestamp) / 1000));
      };

      calculateElapsedTime(); // Initial calculation
      interval = setInterval(calculateElapsedTime, 1000);
    } else {
      // If not running or no startTime, reset elapsed time
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [running, startTime]);

  return (
    <Typography variant={variant} component="p" sx={sx}>
      {formatTime(elapsedTime)}
    </Typography>
  );
}