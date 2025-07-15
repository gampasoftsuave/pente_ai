import { Controller, Get, Res, Logger } from '@nestjs/common';
import { CustomerService } from './customers.service';
import {
  CUSTOMER_API_PATH,
  SUMMARY_INTEGRATION_API_NAME,
} from 'src/common/const';
import { Response } from 'express';

@Controller(SUMMARY_INTEGRATION_API_NAME)
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);
  constructor(private readonly customerService: CustomerService) {}

  @Get(CUSTOMER_API_PATH.GETCUSTOMERS)
  async getCustomers(@Res() res: Response) {
    this.logger.log('Fetching all customers');
    try {
      const customers = await this.customerService.getAllCustomers();
      return res.status(200).json(customers);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : 'Internal server error';
      this.logger.error(`Error fetching customers: ${errorMessage}`);
      return res.status(500).json({ error: errorMessage });
    }
  }
}
