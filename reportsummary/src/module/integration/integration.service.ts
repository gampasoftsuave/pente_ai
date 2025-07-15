import { Injectable, Logger } from '@nestjs/common';
import { getDb } from 'src/db/mongodb.provider';
import { Request, Response } from 'express';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  async fetchAggregatedQueryData() {
    this.logger.log('Fetching aggregated data');
    const db = await getDb();

    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1,
        },
      },
    ];

    const results = await db
      .collection('queries')
      .aggregate(pipeline)
      .toArray();
    return results;
  }

  async fetchMonthlyInvoiceTotals() {
    this.logger.log(
      'Fetching aggregated invoice data (month summary + per‑status rows)',
    );
    const db = await getDb();

    const baseMatch = {
      $or: [{ removed: false }, { removed: { $exists: false } }],
    };

    const pipeline = [
      { $match: baseMatch },
      {
        $group: {
          _id: {
            year: { $year: '$created' },
            month: { $month: '$created' },
          },
          totalAmount: { $sum: '$total' },
          invoiceCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: 1,
          invoiceCount: 1,
          year: '$_id.year',
          month: '$_id.month',
          order: { $literal: 0 },
        },
      },

      {
        $unionWith: {
          coll: 'invoices',
          pipeline: [
            { $match: baseMatch },
            {
              $group: {
                _id: {
                  year: { $year: '$created' },
                  month: { $month: '$created' },
                  status: '$status',
                },
                totalAmount: { $sum: '$total' },
                invoiceCount: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                totalAmount: 1,
                invoiceCount: 1,
                year: '$_id.year',
                month: '$_id.month',
                status: '$_id.status',
                order: { $literal: 1 },
              },
            },
          ],
        },
      },

      { $sort: { year: 1, month: 1, order: 1, status: 1 } },
      { $project: { order: 0 } },
    ];

    return db.collection('invoices').aggregate(pipeline).toArray();
  }

  async getSummary() {
    this.logger.log('Fetching summary data');
    try {
      const aggregatedqueryData = await this.fetchAggregatedQueryData();
      const aggregatedInvoiceData = await this.fetchMonthlyInvoiceTotals();
      return {
        Result: { query: aggregatedqueryData, invoice: aggregatedInvoiceData },
        Message: 'Summary data fetched successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching summary data: ${error}`);
      throw error;
    }
  }

  async handleWebhook(req: Request) {
    this.logger.log('Handling webhook request');

    try {
      const db = await getDb();
      const data = req.body as Record<string, unknown>;

      this.logger.log(`Webhook data received: ${JSON.stringify(data)}`);

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        this.logger.error('Invalid webhook data format');
        throw new Error('Invalid webhook data format');
      }

      const insertResults: Record<string, { insertedCount: number }> = {};
      const now = new Date(); // ‼ capture once

      for (const collectionName of Object.keys(data)) {
        const documents = (data as Record<string, unknown[]>)[collectionName];
        if (!Array.isArray(documents)) {
          this.logger.warn(
            `Skipping collection "${collectionName}" because data is not an array`,
          );
          continue;
        }

        // Add timestamps to each document
        const docsWithTimestamps = documents.map((doc) => {
          // Type guard to ensure doc is an object
          if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
            this.logger.warn(
              `Skipping invalid document: ${JSON.stringify(doc)}`,
            );
            return doc;
          }

          const d: any = { ...doc };

          // Always add created timestamp if it doesn't exist
          if (!d.created) {
            d.created = now;
          }

          // Always add/update the updated timestamp
          d.updated = now;

          return d;
        });

        const collection = db.collection(collectionName);
        const insertResult = await collection.insertMany(docsWithTimestamps);

        insertResults[collectionName] = {
          insertedCount: insertResult.insertedCount,
        };
        this.logger.log(
          `Inserted ${insertResult.insertedCount} documents into collection "${collectionName}"`,
        );
      }

      return { Result: insertResults };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error}`);
      throw error;
    }
  }
}
