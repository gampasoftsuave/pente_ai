import { Injectable, Logger } from '@nestjs/common';
import { getDb } from 'src/db/mongodb.provider';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  async fetchAllCustomers() {
    const db = await getDb();

    const pipeline = [
      {
        $addFields: {
          createdDate: {
            $cond: [
              {
                $and: [
                  { $isArray: ['$created'] }, // just in case it's an array - unlikely, but safe
                ],
              },
              null,
              {
                $switch: {
                  branches: [
                    {
                      case: { $eq: [{ $type: '$created' }, 'string'] },
                      then: { $toDate: '$created' },
                    },
                    {
                      case: { $eq: [{ $type: '$created' }, 'object'] },
                      then: {
                        $toDate: {
                          $getField: {
                            field: '$date',
                            input: '$created',
                          },
                        },
                      },
                    },
                  ],
                  default: '$created',
                },
              },
            ],
          },
        },
      },
      {
        $match: {
          createdDate: { $type: 'date' },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdDate' },
            month: { $month: '$createdDate' },
          },
          enabledCount: {
            $sum: { $cond: [{ $eq: ['$enabled', true] }, 1, 0] },
          },
          removedCount: {
            $sum: { $cond: [{ $eq: ['$removed', true] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          enabledCount: 1,
          removedCount: 1,
          totalCount: 1,
        },
      },
      {
        $sort: { year: 1, month: 1 },
      },
    ];

    return db.collection('clients').aggregate(pipeline).toArray();
  }

  async getAllCustomers() {
    this.logger.log('Fetching all customers');
    try {
      const customers = await this.fetchAllCustomers();
      return {
        Result: customers,
        Message: 'Customers fetched successfully',
      };
    } catch (error) {
      this.logger.error(`Error fetching customers: ${error}`);
      throw error;
    }
  }
}
