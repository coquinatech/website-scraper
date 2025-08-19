import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '../config/database.config.js';

// Store connection instances
let sqlInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create the database connection
 * This allows the connection to be created after environment variables are set
 */
export function getDb() {
  if (!dbInstance) {
    // Re-read config to get current environment variables
    const currentConfig = {
      connectionString: process.env['DATABASE_URL'] ?? databaseConfig.connectionString,
      pool: databaseConfig.pool,
    };

    sqlInstance = postgres(currentConfig.connectionString, {
      max: currentConfig.pool.max,
      idle_timeout: currentConfig.pool.idleTimeout,
      connect_timeout: currentConfig.pool.connectTimeout,
    });
    dbInstance = drizzle(sqlInstance);
  }
  return dbInstance;
}

/**
 * Get the SQL connection (for raw queries)
 */
export function getSql() {
  if (!sqlInstance) {
    getDb(); // Ensure connection is created
  }
  return sqlInstance!;
}

/**
 * Close and reset connections (for testing)
 */
export async function resetDbConnection() {
  if (sqlInstance) {
    await sqlInstance.end();
    sqlInstance = null;
    dbInstance = null;
  }
}

// Export as named exports for ES modules
export const db = new Proxy(
  {},
  {
    get(target, prop, _receiver) {
      const actualDb = getDb();
      return Reflect.get(actualDb, prop, actualDb);
    },
  }
) as ReturnType<typeof drizzle>;

export const sql = new Proxy((() => {}) as any, {
  get(target, prop, _receiver) {
    const actualSql = getSql();
    return Reflect.get(actualSql, prop, actualSql);
  },
  apply(target, thisArg, argumentsList) {
    const actualSql = getSql();
    return Reflect.apply(actualSql, thisArg, argumentsList);
  },
}) as ReturnType<typeof postgres>;
