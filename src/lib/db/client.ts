import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

declare global {
  
  var __dbClient: ReturnType<typeof postgres> | undefined;
}
const client =
  global.__dbClient ??
  postgres({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,   // <-- 'require' se false kiya, self-hosted Postgres mostly SSL support nahi karta
    max: 1,
  });
if (process.env.NODE_ENV !== 'production') {
  global.__dbClient = client;
}

export const db = drizzle(client, { schema });