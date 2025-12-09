// produccion_tiraje/src/utils/statusMappers.ts
import { Job } from '../services/api';

type JobStatus = Job['status'];

export const getDisplayStatus = (status: JobStatus): string => {
  switch (status) {
    case 'en_curso':
      return 'En Curso';
    case 'pausado':
      return 'En Pausa';
    case 'en_cola':
      return 'En Cola';
    case 'terminado':
      return 'Terminado';
    case 'cancelado':
      return 'Cancelado';
    default:
      return status; // Fallback for any unexpected status
  }
};
