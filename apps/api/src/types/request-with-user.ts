import type { Request } from 'express';

/**
 * The `user` object that Passport attaches to `req`.
 * We make `sub` optional because some guards may only attach `id`.
 */
export type RequestUser = {
  id: string;
  email?: string;
  sub?: string;
};

export type RequestWithUser = Request & { user: RequestUser };
