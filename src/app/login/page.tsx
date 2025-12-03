'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginPage.module.css';

const LoginPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login({ employeeId, password });
      // La redirección ahora es manejada por el AuthContext
    } catch (err) {
      setError('Credenciales incorrectas. Por favor, intente de nuevo.');
      console.error(err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Iniciar Sesión</h2>
        <form onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label htmlFor="employeeId">ID de Empleado</label>
            <input
              type="text"
              id="employeeId"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.loginButton}>Acceder</button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
