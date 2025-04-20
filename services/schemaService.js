import { db } from './mongoService.js';

const ALLOWED_COLLECTIONS = new Set(['discussions','posts','jobvcancies']);

export async function getMongoSchema() {
  const schema = {};
  for (const name of ALLOWED_COLLECTIONS) {
    const sample = await db.collection(name).findOne();
    schema[name] = sample ? Object.keys(sample) : ['No documents in this collection'];
  }
  return schema;
}

export function isCollectionAllowed(name) {
  return ALLOWED_COLLECTIONS.has(name);
}

