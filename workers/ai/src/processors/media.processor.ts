import { Worker } from 'bullmq';
import type { Processor, Job } from 'bullmq';
import { connection } from '../redis';
import pino from 'pino';

// Kuyruk adı burada da aynı olmalı
export const mediaQueueName = 'media-pipeline';
export const mediaProcessorName = 'media:processor';

const logger = pino({
  transport: { target: 'pino-pretty', options: { colorize: true } }
});

const processor: Processor = async (job: Job) => {
  logger.info({ id: job.id, name: job.name, data: job.data }, 'job received');

  switch (job.name) {
    case 'BG_REMOVE':
      await sleep(500);
      logger.info('bg-removed (mock)');
      return { bgRemovedUrl: `mock://bg/${(job.data as any).fileKey}` };

    case 'TAG_EMBED':
      await sleep(400);
      logger.info('tag+embed (mock)');
      return { labels: ['top', 'casual'], embedding: 'mock-clip-vec' };

    case 'COLOR_EXTRACT':
      await sleep(300);
      logger.info('color extracted (mock)');
      return { color: '#a1a1a1', season: ['spring', 'fall'] };

    default:
      throw new Error(`Unknown job: ${job.name}`);
  }
};

export function startMediaWorker() {
  const worker = new Worker(mediaQueueName, processor, {
    connection,
    concurrency: 4
  });

  worker.on('completed', (job, result) => {
    logger.info({ id: job.id, result }, 'job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ id: job?.id, err }, 'job failed');
  });

  logger.info({ name: mediaProcessorName }, 'worker started');
  return worker;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
