import type { Request } from 'express';
import type { JwtPayload } from '../auth/types';

export type RequestWithUser = Request & { user?: JwtPayload };
