// src/components/JobCardChronometer.tsx
'use client';

import { useState, useEffect } from 'react';
import { Typography, TypographyProps, SxProps, Theme } from '@mui/material';
import { Job } from '../services/api';

interface ChronometerProps {
  running: boolean;
  startTime?: Date | null;
  totalPauseTime?: number; // in seconds
  timeline?: Job['timeline'];
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

export default function JobCardChronometer({ running, startTime = null, totalPauseTime = 0, timeline = [], variant = 'body2', sx }: ChronometerProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    const calculateElapsedTime = () => {
      if (!startTime) return 0;
      const startTimestamp = startTime.getTime();
      const now = Date.now();
      const grossElapsedTime = Math.floor((now - startTimestamp) / 1000);
      return grossElapsedTime - totalPauseTime;
    };

    if (running) {
      interval = setInterval(() => {
        setElapsedTime(Math.max(0, calculateElapsedTime()));
      }, 1000);
    } else {
        // Paused state
        if (startTime) {
            const lastPauseEvent = timeline?.filter(e => e.type === 'pause_start').pop();
            if (lastPauseEvent) {
                const startTimestamp = startTime.getTime();
                const lastPauseTimestamp = new Date(lastPauseEvent.timestamp).getTime();
                const grossElapsedTime = Math.floor((lastPauseTimestamp - startTimestamp) / 1000);
                const netElapsedTime = grossElapsedTime - totalPauseTime;
                setElapsedTime(Math.max(0, netElapsedTime));
            } else {
                // No pause events, but not running. Show time up to now.
                setElapsedTime(Math.max(0, calculateElapsedTime()));
            }
        } else {
            setElapsedTime(0);
        }
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [running, startTime, totalPauseTime, timeline]);

  return (
    <Typography variant={variant} component="p" sx={sx}>
      {formatTime(elapsedTime)}
    </Typography>
  );
}