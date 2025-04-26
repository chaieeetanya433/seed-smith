import { runSeeder } from '../../src/index';
import { SeederConfig } from '../../src/config/config-loader';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

// These tests require actual database connections
// They should be run only when the environment variables are set
describe('Seeder Integration Tests', () => {
    // Check if we can run MongoDB tests
    const canRunMongoTests = process.env.TEST_MONGODB_URI !== undefined;

    // Check if we can run PostgreSQL tests
    const canRunPgTests = process.env.TEST_PG_DATABASE !== undefined
        && process.env.TEST_PG_USER !== undefined;

    // MongoDB tests
    (canRunMongoTests ? describe : describe.skip)('MongoDB Seeder', () => {
        let mongoClient: MongoClient;

        beforeAll(async () => {
            mongoClient = new MongoClient(process.env.TEST_MONGODB_URI!);
            await mongoClient.connect();
        });

        afterAll(async () => {
            await mongoClient.close();
        });

        it('should seed data into MongoDB', async () => {
            const config: SeederConfig = {
                database: {
                    type: 'mongodb',
                    uri: process.env.TEST_MONGODB_URI
                },
                seeds: [
                    {
                        name: 'test_users',
                        data: [
                            { name: 'Test User 1', email: 'test1@example.com' },
                            { name: 'Test User 2', email: 'test2@example.com' }
                        ]
                    }
                ],
                options: {
                    clearBeforeSeeding: true
                }
            };

            await runSeeder(config);

            // Verify data was inserted
            const db = mongoClient.db();
            const collection = db.collection('test_users');
            const count = await collection.countDocuments();
            console.log(count);
            expect(count).toBe(2);

            // Clean up
            await collection.deleteMany({});
        });
    });

    // PostgreSQL tests
    (canRunPgTests ? describe : describe.skip)('PostgreSQL Seeder', () => {
        let pgPool: Pool;

        beforeAll(async () => {
            pgPool = new Pool({
                host: process.env.TEST_PG_HOST || 'localhost',
                port: parseInt(process.env.TEST_PG_PORT || '5432'),
                user: process.env.TEST_PG_USER,
                password: process.env.TEST_PG_PASSWORD,
                database: process.env.TEST_PG_DATABASE
            });

            // Create test table if it doesn't exist
            await pgPool.query(`
        CREATE TABLE IF NOT EXISTS test_products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          price NUMERIC(10, 2)
        )
      `);
        });

        afterAll(async () => {
            // Drop test table
            await pgPool.query('DROP TABLE IF EXISTS test_products');
            await pgPool.end();
        });

        it('should seed data into PostgreSQL', async () => {
            const config: SeederConfig = {
                database: {
                    type: 'postgresql',
                    host: process.env.TEST_PG_HOST || 'localhost',
                    port: parseInt(process.env.TEST_PG_PORT || '5432'),
                    username: process.env.TEST_PG_USER,
                    password: process.env.TEST_PG_PASSWORD,
                    database: process.env.TEST_PG_DATABASE
                },
                seeds: [
                    {
                        name: 'test_products',
                        data: [
                            { name: 'Test Product 1', price: 19.99 },
                            { name: 'Test Product 2', price: 29.99 }
                        ]
                    }
                ],
                options: {
                    clearBeforeSeeding: true
                }
            };

            await runSeeder(config);

            // Verify data was inserted
            const result = await pgPool.query('SELECT COUNT(*) FROM test_products');
            console.log(result, 'product_details');
            expect(parseInt(result.rows[0].count)).toBe(2);

            // Clean up
            await pgPool.query('TRUNCATE TABLE test_products');
        });
    });
});