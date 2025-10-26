import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: true,
    environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.0
  });
}
