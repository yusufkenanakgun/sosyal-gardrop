import dotenv from 'dotenv';
import { z } from 'zod';

// Kök .env ve local .env okuma (kök .env yoksa sorun değil)
dotenv.config({ path: '../../.env' });
dotenv.config();

const schema = z.object({
  REDIS_URL: z.string().url()
});

export const env = schema.parse({
  REDIS_URL: process.env.REDIS_URL
});
