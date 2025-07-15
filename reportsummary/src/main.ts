import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 8080).then(() => {
    console.log(`Application is running on: ${process.env.PORT ?? 8080}`);
  });
}
bootstrap().catch((error) => {
  console.error('Error during application bootstrap:', error);
});
