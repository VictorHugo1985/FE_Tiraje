// src/theme/theme.ts
'use client';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

// Crea una instancia del tema para poder personalizarla
const theme = createTheme({
  palette: {
    primary: {
      main: '#556cd6',
    },
    secondary: {
      main: '#19857b',
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
