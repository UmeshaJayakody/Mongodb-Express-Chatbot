import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

export let db;
const mongoClient = new MongoClient(process.env.DATABASE_URI);

export async function connectMongo() {
  try {
    await mongoClient.connect();
    db = mongoClient.db(process.env.DB_NAME_CHAT);
    console.log('🤖 chatbot is connected to the database ✅');
  } catch (err) {
    console.error('⚠️ MongoDB connection error:', err);
  }
}
