import { afterAll, beforeAll } from 'vitest';
import { resetDbConnection } from './src/db/index.js';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

/**
 * Global test setup for all tests
 * This runs once before all test files
 */

// Set a global flag to indicate DBOS can be initialized
global.DBOS_CAN_INITIALIZE = false;
global.DBOS_INITIALIZED = false;
global.DBOS_TEST_DB = null;

// Store original database URLs
const ORIGINAL_DATABASE_URL = process.env.DATABASE_URL;
const ORIGINAL_DBOS_SYSTEM_DATABASE_URL = process.env.DBOS_SYSTEM_DATABASE_URL;

// Generate unique test database name for this test run
const TEST_DB_NAME = `test_db_${Date.now()}_${Math.random().toString(36).substring(7)}`;

beforeAll(async () => {
  console.log('Global test setup starting...');
  console.log(`Creating test database: ${TEST_DB_NAME}`);
  
  try {
    // Connect to postgres to create test database
    const adminUrl = ORIGINAL_DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/postgres';
    const adminSql = postgres(adminUrl, { max: 1 });
    
    // Drop test database if it exists (shouldn't, but just in case)
    await adminSql`DROP DATABASE IF EXISTS ${adminSql(TEST_DB_NAME)} WITH (FORCE)`;
    
    // Create fresh test database
    await adminSql`CREATE DATABASE ${adminSql(TEST_DB_NAME)}`;
    console.log(`Test database ${TEST_DB_NAME} created`);
    
    // Update environment variables to point to test database
    const testDbUrl = adminUrl.replace(/\/[^/]*$/, `/${TEST_DB_NAME}`);
    process.env.DATABASE_URL = testDbUrl;
    process.env.DBOS_SYSTEM_DATABASE_URL = testDbUrl;
    
    // Reset any existing connections to use new DATABASE_URL
    await resetDbConnection();
    
    // Run migrations on test database
    const testSql = postgres(testDbUrl, { max: 1 });
    const testDb = drizzle(testSql);
    
    console.log('Running migrations on test database...');
    await migrate(testDb, { migrationsFolder: './drizzle' });
    
    // Seed default workflow for tests
    console.log('Seeding default workflow...');
    const DEFAULT_WORKFLOW_ID = '00000000-0000-0000-0000-000000000001';
    await testSql`
      INSERT INTO workflows (id, name, system_prompt, created_at, updated_at)
      VALUES (
        ${DEFAULT_WORKFLOW_ID},
        'Default Assistant',
        'You are a helpful AI assistant. Be concise, accurate, and friendly in your responses.',
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;
    
    // Seed default roles for user management tests
    console.log('Seeding default roles...');
    await testSql`
      INSERT INTO roles (name, description, created_at, updated_at)
      VALUES 
        ('admin', 'Administrator with full system access', NOW(), NOW()),
        ('user', 'Regular user with standard access', NOW(), NOW())
      ON CONFLICT (name) DO NOTHING
    `;
    
    // Close migration connection
    await testSql.end();
    
    // Close admin connection
    await adminSql.end();
    
    console.log('Test database ready');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
  
  // Mark that tests can now initialize DBOS (but only one should)
  global.DBOS_CAN_INITIALIZE = true;
  
  // We won't initialize DBOS here - let the first test that needs it do so
  // This way tests that don't need DBOS won't fail
});

afterAll(async () => {
  console.log('Global test teardown starting...');
  
  try {
    // Close any open database connections
    await resetDbConnection();
    
    // Restore original database URLs
    if (ORIGINAL_DATABASE_URL) {
      process.env.DATABASE_URL = ORIGINAL_DATABASE_URL;
    } else {
      delete process.env.DATABASE_URL;
    }
    
    if (ORIGINAL_DBOS_SYSTEM_DATABASE_URL) {
      process.env.DBOS_SYSTEM_DATABASE_URL = ORIGINAL_DBOS_SYSTEM_DATABASE_URL;
    } else {
      delete process.env.DBOS_SYSTEM_DATABASE_URL;
    }
    
    // Connect to postgres to drop test database
    const adminUrl = ORIGINAL_DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/postgres';
    const adminSql = postgres(adminUrl, { max: 1 });
    
    // Force disconnect all connections and drop test database
    await adminSql`DROP DATABASE IF EXISTS ${adminSql(TEST_DB_NAME)} WITH (FORCE)`;
    console.log(`Test database ${TEST_DB_NAME} dropped`);
    
    await adminSql.end();
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
  
  console.log('Global test teardown complete');
});