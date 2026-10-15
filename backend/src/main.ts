import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para integración con Frontend (Vite / React)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Prefijo global de la API REST
  app.setGlobalPrefix('api/v1');

  // Pipeline global de validación estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Documentación Interactiva OpenAPI / Swagger
  const config = new DocumentBuilder()
    .setTitle('API de Control de Obra Pública (LOPSRM / RLOPSRM)')
    .setDescription(
      'Documentación interactiva de la API REST para el control, fiscalización y seguimiento de contratos de obra pública en México.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese el token JWT obtenido en el login',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}/api/v1`);
  console.log(`📚 Documentación Swagger disponible en http://localhost:${port}/api/docs`);
}
await bootstrap();
