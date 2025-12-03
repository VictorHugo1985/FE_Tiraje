'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

function ProtectedRoutes({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return; // No hacer nada mientras se carga el estado de autenticación
    }

    // Si no hay usuario y no estamos en la página de login, redirigir a login
    if (!user && pathname !== '/login') {
      router.push('/login');
    }

    // Si hay un usuario y está intentando acceder a la página de login, redirigir a la home
    if (user && pathname === '/login') {
      router.push('/');
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading) {
    return <div>Cargando...</div>; // O un spinner/splash screen
  }

  // No renderizar nada si estamos en una transición de ruta
  if ((!user && pathname !== '/login') || (user && pathname === '/login')) {
    return <div>Redirigiendo...</div>;
  }

  return <>{children}</>;
}

export default function RootLayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoutes>
        {children}
      </ProtectedRoutes>
    </AuthProvider>
  );
}
