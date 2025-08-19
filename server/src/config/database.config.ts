export const databaseConfig = {
  host: process.env['DB_HOST'] ?? 'localhost',
  port: parseInt(process.env['DB_PORT'] ?? '5432', 10),
  user: process.env['DB_USER'] ?? 'postgres',
  password: process.env['DB_PASSWORD'] ?? 'postgres',
  database: process.env['DB_NAME'] ?? 'postgres',
  connectionString: process.env['DATABASE_URL'] ?? 
    `postgresql://${process.env['DB_USER'] ?? 'postgres'}:${process.env['DB_PASSWORD'] ?? 'postgres'}@${process.env['DB_HOST'] ?? 'localhost'}:${process.env['DB_PORT'] ?? '5432'}/${process.env['DB_NAME'] ?? 'postgres'}`,
  pool: {
    max: 10,
    idleTimeout: 20,
    connectTimeout: 10
  }
} as const;