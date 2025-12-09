// src/app/page.tsx
'use client';

import { Box, Button, Typography, Container, Stack, Chip } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();

  if (!user) {
    return <div>Cargando...</div>; // O redirigiendo, aunque el layout ya lo maneja
  }

  const canAccessSupervisor = user.role === 'supervisor' || user.role === 'admin';
  const canAccessOperario = user.role === 'operario' || user.role === 'admin';
  const canAccessColaborador = user.role === 'admin' || user.role === 'supervisor';

  return (
    <Container maxWidth="xl">
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 2, alignItems: 'center' }}>
        <Chip label={`${user.name}`} />
        <Button variant="outlined" onClick={logout}>Cerrar Sesión</Button>
      </Box>
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
        <Stack spacing={1.5} direction="column" sx={{ width: '100%', maxWidth: 300 }}>
          <Link href="/operario" passHref style={{ pointerEvents: canAccessOperario ? 'auto' : 'none' }}>
            <Button variant="contained" color="primary" size="large" fullWidth disabled={!canAccessOperario}>
              Operario
            </Button>
          </Link>
          <Link href="/supervisor" passHref style={{ pointerEvents: canAccessSupervisor ? 'auto' : 'none' }}>
            <Button variant="contained" color="secondary" size="large" fullWidth disabled={!canAccessSupervisor}>
              Supervisor
            </Button>
          </Link>
          <Link href="/colaborador" passHref style={{ pointerEvents: canAccessColaborador ? 'auto' : 'none' }}>
            <Button variant="outlined" color="primary" size="large" fullWidth disabled={!canAccessColaborador}>
              Colaborador
            </Button>
          </Link>
        </Stack>
      </Box>
    </Container>
  );
}
