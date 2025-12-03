'use client';

import { useState, useEffect, useRef } from 'react';
import { Typography, TypographyProps, SxProps, Theme } from '@mui/material';

interface ChronometerProps {
  running: boolean;
  initialElapsedTime?: number; // Time in seconds to start from
  variant?: TypographyProps['variant'];
  sx?: SxProps<Theme>;
  reset?: boolean;
  onReset?: () => void;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds < 0) {
    timeInSeconds = 0;
  }
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
};

export default function OperatorChronometer({
  running,
  initialElapsedTime = 0,
  variant = 'h3',
  sx,
  reset,
  onReset,
}: ChronometerProps) {
  const [elapsedTime, setElapsedTime] = useState(initialElapsedTime);
  const requestRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);

  // Effect to synchronize with the initial time from props when the timer is not running.
  useEffect(() => {
    setElapsedTime(initialElapsedTime);
  }, [initialElapsedTime]);

  // Effect to handle the reset functionality.
  useEffect(() => {
    if (reset) {
      setElapsedTime(0);
      if (onReset) {
        onReset();
      }
    }
  }, [reset, onReset]);

  // Main effect to control the timer loop.
  useEffect(() => {
    if (running) {
      // Set the last update time to now when the timer starts.
      lastUpdateTimeRef.current = performance.now();

      const animate = () => {
        const now = performance.now();
        // Calculate the delta (time passed since last frame) in seconds.
        const delta = (now - lastUpdateTimeRef.current) / 1000;
        
        // Use the functional update form of setState.
        // This receives the previous state and returns the new state,
        // preventing any issues with stale state within the closure.
        setElapsedTime(prevTime => prevTime + delta);

        // Update the last update time for the next frame.
        lastUpdateTimeRef.current = now;
        requestRef.current = requestAnimationFrame(animate);
      };
      
      requestRef.current = requestAnimationFrame(animate);
    }

    // Cleanup function runs when the component unmounts or `running` becomes false.
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [running]); // This effect correctly depends only on the 'running' prop.

  return (
    <Typography variant={variant} component="p" sx={sx}>
      {formatTime(elapsedTime)}
    </Typography>
  );
}