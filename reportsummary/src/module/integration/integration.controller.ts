import { Controller, Get, Logger, Post, Req, Res } from '@nestjs/common';
import { INTEGRATION_API_NAME, INTEGRATION_API_PATH } from 'src/common/const';
import { IntegrationService } from './integration.service';
import { Response, Request } from 'express';

@Controller(INTEGRATION_API_NAME)
export class IntegrationController {
  private readonly logger = new Logger(IntegrationController.name);
  constructor(private readonly integrationService: IntegrationService) {}

  @Get(INTEGRATION_API_PATH.GETSUMMARY)
  async getSummary(@Res() res: Response) {
    this.logger.log('Fetching summary data');
    try {
      const response = await this.integrationService.getSummary();
      return res.status(200).json(response);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : 'Internal server error';
      this.logger.error(`Error fetching customer: ${errorMessage}`);
      return res.status(500).json({ error: errorMessage });
    }
  }

  @Post(INTEGRATION_API_PATH.WEBHOOK)
  async Webhook(@Res() res: Response, @Req() req: Request) {
    this.logger.log('Received webhook data');
    try {
      const response = await this.integrationService.handleWebhook(req);
      return res.status(200).json(response);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : 'Internal server error';
      this.logger.error(`Error processing webhook: ${errorMessage}`);
      return res.status(500).json({ error: errorMessage });
    }
  }
}
