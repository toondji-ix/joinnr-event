import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  await app.listen(4000, '127.0.0.1');
}

bootstrap().catch(() => {
  console.error('API scaffold failed to start.');
  process.exitCode = 1;
});
