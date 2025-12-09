import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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


// --- INTERFACES ---
// Force recompilation
export interface Job {
  _id: string;
  ot: string;
  press: string;
  client: string;
  status: 'en_curso' | 'pausado' | 'en_cola' | 'terminado' | 'cancelado';
  jobType: string;
  quantityPlanned: string;
  checklist: {
    pantone: boolean;
    barniz: boolean;
    colors: "4x0" | "4x4" | "none";
  };
  isCancelled: boolean;
  createdAt: Date;
  updatedAt: Date;
  finishedAt: Date | null;
  priority: number;
  timeline?: any[];
  operatorComments?: string;
  machineSpeed?: string;
  totalPauseTime?: number;
  setupCount?: number;
  pauseCount?: number;
}

// --- MAPPERS ---
const toBackendJob = (job: any) => {
    const { ot, client, jobType, quantityPlanned, comments, press, priority, status, checklist, isCancelled } = job;
            let backendStatus = 'en cola';
            if (isCancelled) backendStatus = 'cancelado';
            else if (status) {
                // Map frontend status (with underscores or 'pausado') to backend status (with spaces or 'pausado')
                if (status === 'en_curso') backendStatus = 'en curso';
                else if (status === 'pausado') backendStatus = 'pausado';
                else if (status === 'en_cola') backendStatus = 'en cola';
                else if (status === 'terminado') backendStatus = 'terminado';
                else if (status === 'cancelado') backendStatus = 'cancelado';
            }    return {
        ot, client, jobType, quantityPlanned: Number(quantityPlanned) || 0, comments, press, priority, status: backendStatus,
        pantone: checklist?.pantone || false, barniz: checklist?.barniz || false,
        is4x0: checklist?.colors === '4x0', is4x4: checklist?.colors === '4x4',
    };
};

const toFrontendJob = (job: any): Job => {
    const colorValue: "4x0" | "4x4" | "none" = job.is4x0 ? '4x0' : job.is4x4 ? '4x4' : 'none';

    let feStatus: 'en_curso' | 'pausado' | 'en_cola' | 'terminado' | 'cancelado' = 'en_cola';
    const parsedStatus = String(job.status); // Backend status is already correct ('en cola', 'pausado', etc.)

            // Mapping to frontend-friendly underscored if needed, but not for 'pausado'
            if (parsedStatus === 'en curso') {
                feStatus = 'en_curso';
            } else if (parsedStatus === 'pausado') {
                feStatus = 'pausado';
            } else if (parsedStatus === 'en cola') {
                feStatus = 'en_cola';
            } else if (parsedStatus === 'terminado') {
                feStatus = 'terminado';
            } else if (parsedStatus === 'cancelado') {
                feStatus = 'cancelado';
            }
            // Default to 'en_cola' if status is unknown or not provided
    return {
        _id: job._id,
        ot: job.ot,
        client: job.client,
        jobType: job.jobType,
        quantityPlanned: String(job.quantityPlanned),
        press: job.press,
        priority: job.priority || 0,
        status: feStatus,
        checklist: {
            pantone: !!job.pantone,
            barniz: !!job.barniz,
            colors: colorValue,
        },
        isCancelled: job.status === 'cancelado',
        createdAt: job.createdAt ? new Date(job.createdAt) : new Date(),
        updatedAt: job.updatedAt ? new Date(job.updatedAt) : new Date(),
        finishedAt: job.status === 'terminado' && job.updatedAt ? new Date(job.updatedAt) : null,
        setupCount: job.setupCount || 0,
        totalPauseTime: job.totalPauseTime || 0,
        pauseCount: job.pauseCount || 0,
        machineSpeed: job.machineSpeed || '',
        operatorComments: job.operatorComments || '',
        timeline: job.timeline || [],
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

export const getJobs = async (filters: { status?: string, press?: string } = {}): Promise<Job[]> => {
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
    if (jobUpdate.status !== undefined) {
        // Now, jobUpdate.status should already be the frontend status ('en_curso', 'pausado', etc.)
        // We need to convert it to the backend's expected format ('en curso', 'pausado', etc.)
        let backendStatus = jobUpdate.status;
        if (jobUpdate.status === 'en_curso') backendStatus = 'en curso';
        else if (jobUpdate.status === 'en_cola') backendStatus = 'en cola';
        // 'pausado', 'terminado', 'cancelado' are the same for frontend and backend
        
        payload.status = backendStatus;
    }
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
        let errorMessage = 'Failed to update job';
        if (axios.isAxiosError(error) && error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        throw new Error(errorMessage);
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

export const getJobById = async (id: string): Promise<Job> => {
    const { data } = await api.get(`/jobs/${id}`);
    return toFrontendJob(data);
};