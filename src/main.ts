import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port, '127.0.0.1');
  console.log(`Aplikasi mahasiswa: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
