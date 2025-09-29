import { db } from './mongoService.js';

// SimplyTix collections based on the models we found
const ALLOWED_COLLECTIONS = new Set(['events', 'users', 'tickets', 'payments', 'enrollments', 'notifications', 'earnings']);

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

// SimplyTix specific helper functions
export function getSimplyTixCollections() {
  return Array.from(ALLOWED_COLLECTIONS);
}

export function getEventRelatedCollections() {
  return ['events', 'tickets', 'enrollments', 'payments'];
}

export function getUserRelatedCollections() {
  return ['users', 'tickets', 'payments', 'enrollments'];
}

