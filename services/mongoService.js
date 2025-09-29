import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

export let db;
const mongoClient = new MongoClient(process.env.MONGO_URI || process.env.DATABASE_URI);

export async function connectMongo() {
  try {
    await mongoClient.connect();
    // Use SimplyTix database name
    db = mongoClient.db('simplytix_Development_DB');
    console.log('🤖 SimplyTix chatbot is connected to the database ✅');
  } catch (err) {
    console.error('⚠️ MongoDB connection error:', err);
  }
}
