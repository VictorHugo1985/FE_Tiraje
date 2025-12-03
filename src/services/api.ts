import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // El backend corre en el puerto 3000
});

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// --- AUTH ---
export const login = async (credentials: { employeeId: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};


// --- MAPPERS ---
const toBackendJob = (job: any) => {
    const { ot, client, jobType, quantityPlanned, comments, press, priority, status, checklist, isCancelled } = job;
    let backendStatus = 'en cola';
    if (isCancelled) backendStatus = 'cancelado';
    else if (status) backendStatus = status.replace('_', ' ');
    return {
        ot, client, jobType, quantityPlanned: Number(quantityPlanned) || 0, comments, press, priority, status: backendStatus,
        pantone: checklist?.pantone || false, barniz: checklist?.barniz || false,
        is4x0: checklist?.colors === '4x0', is4x4: checklist?.colors === '4x4',
    };
};

const toFrontendJob = (job: any) => {
    const { _id, ot, client, jobType, quantityPlanned, comments, press, priority, status, pantone, barniz, is4x0, is4x4, createdAt, updatedAt, setupCount, totalSetupTime, pauseCount, totalPauseTime, timeline } = job;
    let colors = 'none';
    if (is4x0) colors = '4x0';
    if (is4x4) colors = '4x4';
    let feStatus = status ? status.replace(' ', '_') : 'en_cola';
    if (feStatus === 'pausado') feStatus = 'en_pausa';
    return {
        _id, ot, client, jobType, quantityPlanned: String(quantityPlanned),
        comments, press, priority, status: feStatus,
        checklist: { pantone, barniz, colors }, isCancelled: status === 'cancelado',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        finishedAt: status === 'terminado' ? new Date(updatedAt) : null,
        setupCount: setupCount || 0, totalSetupTime: totalSetupTime || 0,
        pauseCount: pauseCount || 0, totalPauseTime: totalPauseTime || 0,
        machineSpeed: job.machineSpeed || '',
        operatorComments: job.operatorComments || '',
        timeline: timeline || [],
    };
};

// --- API FUNCTIONS ---

export enum TimelineEventType {
    PRODUCTION_START = 'production_start',
    PRODUCTION_END = 'production_end',
    SETUP_START = 'setup_start',
    SETUP_END = 'setup_end',
    PAUSE_START = 'pause_start',
    PAUSE_END = 'pause_end',
}

export const getJobs = async (filters: { status?: string, press?: string } = {}) => {
    const { data } = await api.get('/jobs', { params: filters });
    return data.map(toFrontendJob);
};

export const createJob = async (job: any) => {
    const backendJob = toBackendJob(job);
    try {
        const { data } = await api.post('/jobs', backendJob);
        return toFrontendJob(data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to create job');
    }
};

export const updateJob = async (id: string, jobUpdate: any) => {
    const payload: any = {};
    if (jobUpdate.client !== undefined) payload.client = jobUpdate.client;
    if (jobUpdate.jobType !== undefined) payload.jobType = jobUpdate.jobType;
    if (jobUpdate.quantityPlanned !== undefined) payload.quantityPlanned = Number(jobUpdate.quantityPlanned);
    if (jobUpdate.operatorComments !== undefined) payload.operatorComments = jobUpdate.operatorComments;
    if (jobUpdate.machineSpeed !== undefined) payload.machineSpeed = jobUpdate.machineSpeed;

    if (jobUpdate.comments !== undefined) payload.comments = jobUpdate.comments;
    if (jobUpdate.press !== undefined) payload.press = jobUpdate.press;
    if (jobUpdate.priority !== undefined) payload.priority = jobUpdate.priority;
    if (jobUpdate.status !== undefined) payload.status = jobUpdate.status.replace('_', ' ');
    if (jobUpdate.checklist?.pantone !== undefined) payload.pantone = jobUpdate.checklist.pantone;
    if (jobUpdate.checklist?.barniz !== undefined) payload.barniz = jobUpdate.checklist.barniz;
    if (jobUpdate.checklist?.colors !== undefined) {
        payload.is4x0 = jobUpdate.checklist.colors === '4x0';
        payload.is4x4 = jobUpdate.checklist.colors === '4x4';
    }

    try {
        const { data } = await api.patch(`/jobs/${id}`, payload);
        return toFrontendJob(data);
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to update job');
    }
};

export const addTimelineEvent = async (jobId: string, event: { timestamp: Date, type: TimelineEventType, details?: Record<string, any> }) => {
    const payload = { ...event, timestamp: event.timestamp.toISOString() };
    const { data } = await api.post(`/jobs/${jobId}/timeline`, payload);
    return toFrontendJob(data);
};

export const deleteJob = async (id: string) => {
    const { data } = await api.delete(`/jobs/${id}`);
    return data;
};

export const getPauseCauses = async () => {
    const { data } = await api.get('/pause-causes');
    return data;
};

export const getJobById = async (id: string) => {
    const { data } = await api.get(`/jobs/${id}`);
    return toFrontendJob(data);
};