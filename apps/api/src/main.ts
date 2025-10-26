import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { testS3Connection } from './lib/s3.client';

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
  app.getHttpAdapter().get('/api-json', (req, res) => res.json(document));

  await app.listen(4000);
}
bootstrap();
