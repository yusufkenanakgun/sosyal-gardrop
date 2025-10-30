import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { testS3Connection } from './lib/s3.client';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS (dev için açık)
  app.enableCors();

  // MinIO/S3 bağlantı kontrolü
  await testS3Connection();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Sosyal Gardrop API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Swagger JSON'ı güvenli şekilde dönen endpoint
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api-json', (req: Request, res: Response) => {
    res.type('application/json').send(document);
  });

  await app.listen(4000);
}

// no-floating-promises kuralı için:
void bootstrap();
