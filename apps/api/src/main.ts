// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { testS3Connection } from './lib/s3.client';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';
import { SentryExceptionFilter } from './sentry.filter';
import helmet from 'helmet';
import type { Express } from 'express';

async function bootstrap() {
  // Sentry init (DSN var ise)
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      enabled: true,
      environment: process.env.SENTRY_ENV || process.env.NODE_ENV,
      tracesSampleRate: 0.0,
    });
  }

  const app = await NestFactory.create(AppModule);

  // Express instance'ını tipli kullan (any zincirini kes)
  const expressApp = app.getHttpAdapter().getInstance() as unknown as Express;
  expressApp.disable?.('x-powered-by');

  // Global Sentry exception filter
  app.useGlobalFilters(new SentryExceptionFilter());

  app.use(
    helmet({
      contentSecurityPolicy: false, // DEV: Swagger ve inline script/css rahat etsin
      hsts: false, // DEV: localhost http için gereksiz
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
  });

  // MinIO/S3 bağlantı testi (log amaçlı)
  await testS3Connection();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Sosyal Gardrop API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // /api-json (Swagger JSON) – tip güvenli handler
  // AbstractHttpAdapter tipi burada any döndürebilir; expressApp üzerinden route eklemek daha güvenli.
  expressApp.get('/api-json', (req: Request, res: Response) => {
    res.type('application/json').send(document);
  });

  await app.listen(4000);
}

bootstrap().catch((err) => {
  try {
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(err);
      void Sentry.flush(2000);
    }
  } catch {
    /* noop */
  }
  // Son çare: stderr ve exit

  console.error(err);
  process.exit(1);
});
