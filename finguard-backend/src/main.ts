import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173'
  })

  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }))

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`FINGUARD backend running → http://localhost:${port}/api`)
}
bootstrap();
