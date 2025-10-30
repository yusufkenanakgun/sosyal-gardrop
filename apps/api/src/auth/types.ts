export interface JwtPayload {
  sub: string;
  email?: string;
  id?: string;
  [k: string]: unknown;
}
