import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    if (process.env.SENTRY_DSN) {
      Sentry.captureException(exception, {
        tags: { scope: 'http' },
        extra: {
          url: req?.url,
          method: req?.method,
        },
      });
    }

    let payload: unknown;
    if (exception instanceof HttpException) {
      payload = exception.getResponse();
    } else {
      payload = { statusCode: status, message: 'Internal server error' };
    }

    res.status(status).json(payload as Record<string, unknown>);
  }
}
