// src/app/page.tsx
'use client';

import { Box, Button, Typography, Container, Stack } from '@mui/material';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
          Selección de Rol
        </Typography>
        <Stack spacing={2} direction="column" sx={{ width: '100%', maxWidth: 300 }}>
          <Link href="/operario" passHref>
            <Button variant="contained" color="primary" size="large" fullWidth>
              Operario
            </Button>
          </Link>
          <Link href="/supervisor" passHref>
            <Button variant="contained" color="secondary" size="large" fullWidth>
              Supervisor
            </Button>
          </Link>
          <Link href="/colaborador" passHref>
            <Button variant="outlined" color="primary" size="large" fullWidth>
              Colaborador
            </Button>
          </Link>
        </Stack>
      </Box>
    </Container>
  );
}
