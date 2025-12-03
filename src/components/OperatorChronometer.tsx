// src/components/OperatorChronometer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Typography, TypographyProps, SxProps, Theme } from '@mui/material';

interface ChronometerProps {
  running: boolean;
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

export default function OperatorChronometer({ running, variant = 'h3', sx }: ChronometerProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (running) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [running]);

  return (
    <Typography variant={variant} component="p" sx={sx}>
      {formatTime(time)}
    </Typography>
  );
}
