// Single source of truth for JWT payload shape
export type JwtPayload = {
  sub: string;
  email?: string;
  typ?: 'refresh' | 'access';
  iat?: number;
  exp?: number;
};

// Type guard to safely narrow unknown → JwtPayload
export function isJwtPayload(val: unknown): val is JwtPayload {
  return (
    typeof val === 'object' &&
    val !== null &&
    typeof (val as Record<string, unknown>).sub === 'string'
  );
}
