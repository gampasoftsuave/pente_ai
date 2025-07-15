import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerController } from './module/customers/customers.controller';
import { IntegrationController } from './module/integration/integration.controller';
import { CustomerService } from './module/customers/customers.service';
import { IntegrationService } from './module/integration/integration.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    CustomerController,
    CustomerController,
    IntegrationController,
  ],
  providers: [AppService, IntegrationService, CustomerService],
})
export class AppModule {}
