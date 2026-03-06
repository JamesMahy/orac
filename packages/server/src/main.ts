import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
  if (corsOrigin === '*') {
    throw new Error(
      'CORS_ORIGIN must not be wildcard (*) when credentials are enabled',
    );
  }
  app.enableCors({ origin: corsOrigin, credentials: true });

  const isDev = process.env.NODE_ENV !== 'production';
  const swaggerExplicitlyEnabled = process.env.SWAGGER_ENABLED === 'true';

  if (isDev || swaggerExplicitlyEnabled) {
    const config = new DocumentBuilder()
      .setTitle('ORAC API')
      .setDescription('ORAC backend API')
      .setVersion('0.1')
      .addCookieAuth('session')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
