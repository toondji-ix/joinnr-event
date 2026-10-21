import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  // Verify framework boot only; no consumer or recurring work exists yet.
  await app.close();
}

bootstrap().catch(() => {
  console.error('Worker scaffold failed to initialize.');
  process.exitCode = 1;
});
