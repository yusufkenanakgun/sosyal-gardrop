import { env } from './env';
import IORedis from 'ioredis';

export const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true
});

connection.on('connect', () => {
  console.log('[redis] connected');
});
connection.on('error', (err) => {
  console.error('[redis] error', err);
});
