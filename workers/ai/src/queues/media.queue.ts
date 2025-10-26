import { Queue } from 'bullmq';
import { connection } from '../redis';

export type MediaJobType = 'BG_REMOVE' | 'TAG_EMBED' | 'COLOR_EXTRACT';

export interface MediaJobData {
  userId: string;
  fileKey: string; // MinIO/R2 object key
  type: MediaJobType;
}

// ❗ ':' yasak — düzeltildi:
export const mediaQueueName = 'media-pipeline';

export const mediaQueue = new Queue<MediaJobData>(mediaQueueName, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 24 * 3600 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
});

export async function enqueueMediaJob(data: MediaJobData) {
  return mediaQueue.add(data.type, data, {
    priority: data.type === 'BG_REMOVE' ? 1 : 5
  });
}
