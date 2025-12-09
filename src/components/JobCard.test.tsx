
import { render, screen } from '@testing-library/react';
import JobCard from './JobCard';
import { Job, JobStatus, TimelineEventType } from '../../services/api';

describe('JobCard', () => {
  const baseJob: Job = {
    _id: '1',
    ot: 'OT123',
    press: 'Prensa 102',
    client: 'Test Client',
    status: JobStatus.EN_COLA,
    jobType: 'Test Job',
    quantityPlanned: 1000,
    checklist: { pantone: false, barniz: false, colors: 'none' },
    isCancelled: false,
    createdAt: new Date().toISOString(),
    timeline: [],
    priority: 0,
  };

  it('should display the priority number for the first job in the queue', () => {
    render(<JobCard job={baseJob} />);
    const priorityChip = screen.getByText('#1');
    expect(priorityChip).toBeInTheDocument();
  });

  it('should display the correct priority number for another job in the queue', () => {
    const jobWithPriority5 = { ...baseJob, priority: 4 };
    render(<JobCard job={jobWithPriority5} />);
    const priorityChip = screen.getByText('#5');
    expect(priorityChip).toBeInTheDocument();
  });

  it('should not display the priority number for jobs not in "en_cola" status', () => {
    const inProgressJob = { ...baseJob, status: JobStatus.EN_CURSO };
    render(<JobCard job={inProgressJob} />);
    const priorityChip = screen.queryByText(/#\d+/);
    expect(priorityChip).not.toBeInTheDocument();
  });

  it('should not display the priority number if priority is not set', () => {
    const jobWithoutPriority = { ...baseJob, priority: undefined };
    render(<JobCard job={jobWithoutPriority} />);
    const priorityChip = screen.queryByText(/#\d+/);
    expect(priorityChip).not.toBeInTheDocument();
  });
});
