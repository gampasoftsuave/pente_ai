import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_DB_URI;
const dbName = process.env.DB_NAME;

export const mongoClient = new MongoClient(uri);
let isConnected = false;

export async function getDb() {
  if (!isConnected) {
    await mongoClient.connect();
    isConnected = true;
  }
  return mongoClient.db(dbName);
}
