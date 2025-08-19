import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { databaseConfig } from '../config/database.config.js';
import { dbLogger } from '../utils/logger.js';

export async function runMigrations() {
  const sql = postgres(databaseConfig.connectionString, { max: 1 });
  const db = drizzle(sql);
  
  dbLogger.info('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    dbLogger.info('Database migrations completed successfully');
  } catch (error) {
    dbLogger.error({ err: error }, 'Database migration failed');
    throw error;
  } finally {
    await sql.end();
  }
}

// If running directly, execute migrations
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}