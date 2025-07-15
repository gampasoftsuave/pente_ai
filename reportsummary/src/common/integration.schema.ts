import * as Joi from 'joi';

export const CustomerSummarySchema = Joi.object({
  customerId: Joi.string().required(),
});

export const InvoiceSummarySchema = Joi.object({
  invoiceId: Joi.string().required(),
});

export const QuerySummarySchema = Joi.object({
  queryId: Joi.string().required(),
});
