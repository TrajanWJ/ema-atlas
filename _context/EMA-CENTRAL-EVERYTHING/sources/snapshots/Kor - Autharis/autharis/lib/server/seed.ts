import {
  ADMIN_QUEUE,
  CATEGORIES,
  ENGAGEMENTS,
  INVOICES,
  JOB_REQUESTS,
  SKILLS,
  TALENT,
  TIMESHEETS,
} from '@/lib/data';
import type { AutharisSnapshot } from '@/lib/server/contracts';

export function createSeedSnapshot(): AutharisSnapshot {
  return structuredClone({
    skills: SKILLS,
    categories: CATEGORIES,
    talent: TALENT,
    jobRequests: JOB_REQUESTS,
    engagements: ENGAGEMENTS,
    timesheets: TIMESHEETS,
    invoices: INVOICES,
    adminQueue: ADMIN_QUEUE,
  });
}
