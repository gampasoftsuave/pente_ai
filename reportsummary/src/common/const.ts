import Joi from 'joi';

export const SUMMARY_INTEGRATION_API_NAME = 'summary';

export const INTEGRATION_API_NAME = 'integration';

export const INTEGRATION_API_PATH = {
  GETSUMMARY: 'reports/summary',
  WEBHOOK: 'webhook',
};

export const CUSTOMER_API_PATH = {
  GETCUSTOMERS: 'customers',
};

export function isValidSchema(
  queryParams: Record<string, any>,
  schema: Joi.ObjectSchema,
): { isValid: boolean; validationErrorMessage?: string } {
  const { error } = schema.validate(queryParams);
  return { isValid: !error, validationErrorMessage: error?.message };
}
