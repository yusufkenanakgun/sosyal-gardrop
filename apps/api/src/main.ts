import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { testS3Connection } from './lib/s3.client';
import type { Request, Response } from 'express'; // ✅ Ekledik

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS dev için açık
  app.enableCors();

  await testS3Connection();

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Sosyal Gardrop API')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // ❗ any-unsafe hatalarını önlemek için Request/Response tipi kullan
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api-json', (req: Request, res: Response) => {
    res.type('application/json').send(document); // void; no unsafe return
  });

  await app.listen(4000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
