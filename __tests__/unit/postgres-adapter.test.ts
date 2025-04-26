import { PostgresAdapter } from '../../src/adapters/postgres-adapter';
import { Pool, PoolClient } from 'pg';
import { DatabaseConfig, SeedData } from '../../src/config/config-loader';

// Mock pg
jest.mock('pg');

describe('PostgresAdapter', () => {
    let adapter: PostgresAdapter;
    let mockClient: jest.Mocked<PoolClient>;
    let mockPool: jest.Mocked<Pool>;

    const mockConfig: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'user',
        password: 'pass',
        database: 'testdb'
    };

    beforeEach(() => {
        // Reset mocks
        jest.resetAllMocks();

        // Setup pg mocks
        mockClient = {
            query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
            release: jest.fn()
        } as unknown as jest.Mocked<PoolClient>;

        mockPool = {
            connect: jest.fn().mockResolvedValue(mockClient),
            end: jest.fn().mockResolvedValue(undefined)
        } as unknown as jest.Mocked<Pool>;

        (Pool as unknown as jest.Mock).mockImplementation(() => mockPool);

        adapter = new PostgresAdapter(mockConfig);
    });

    it('should connect to PostgreSQL', async () => {
        await adapter.connect();

        expect(Pool).toHaveBeenCalledWith({
            host: 'localhost',
            port: 5432,
            user: 'user',
            password: 'pass',
            database: 'testdb'
        });
        expect(mockPool.connect).toHaveBeenCalled();
    });

    it('should disconnect from PostgreSQL', async () => {
        await adapter.connect();
        await adapter.disconnect();

        expect(mockClient.release).toHaveBeenCalled();
        expect(mockPool.end).toHaveBeenCalled();
    });

    it('should clear data', async () => {
        const seeds: SeedData[] = [
            { name: 'users', data: [] },
            { name: 'products', data: [] }
        ];

        await adapter.connect();
        await adapter.clearData(seeds);

        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
        expect(mockClient.query).toHaveBeenCalledWith('TRUNCATE TABLE users CASCADE');
        expect(mockClient.query).toHaveBeenCalledWith('TRUNCATE TABLE products CASCADE');
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should seed data with identity field', async () => {
        const seed: SeedData = {
            name: 'users',
            options: {
                identityField: 'email'
            },
            data: [
                { name: 'John', email: 'john@example.com', role: 'admin' }
            ]
        };

        await adapter.connect();
        const result = await adapter.seedData(seed);

        expect(result).toBe(1);
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

        // This is testing the upsert query which is complex, so we just check it contains key parts
        const upsertQueryCall = mockClient.query.mock.calls.find(call =>
            typeof call[0] === 'string' &&
            call[0].includes('INSERT INTO users') &&
            call[0].includes('ON CONFLICT (email)')
        );

        expect(upsertQueryCall).toBeDefined();
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should seed data without identity field', async () => {
        const seed: SeedData = {
            name: 'products',
            data: [
                { id: 1, name: 'Product A', price: 19.99 }
            ]
        };

        await adapter.connect();
        const result = await adapter.seedData(seed);

        expect(result).toBe(1);
        expect(mockClient.query).toHaveBeenCalledWith('BEGIN');

        // This is testing the insert query which is complex, so we just check it contains key parts
        const insertQueryCall = mockClient.query.mock.calls.find(call =>
            typeof call[0] === 'string' &&
            call[0].includes('INSERT INTO products')
        );

        expect(insertQueryCall).toBeDefined();
        expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
});