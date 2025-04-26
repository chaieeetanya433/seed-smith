import { MongoDBAdapter } from '../../src/adapters/mongodb-adapter';
import { MongoClient, Db, Collection } from 'mongodb';
import { DatabaseConfig, SeedData } from '../../src/config/config-loader';

// Mock MongoDB
jest.mock('mongodb');

describe('MongoDBAdapter', () => {
    let adapter: MongoDBAdapter;
    let mockDb: jest.Mocked<Db>;
    let mockCollection: jest.Mocked<Collection>;
    let mockClient: jest.Mocked<MongoClient>;

    const mockConfig: DatabaseConfig = {
        type: 'mongodb',
        uri: 'mongodb://localhost:27017/testdb'
    };

    beforeEach(() => {
        // Reset mocks
        jest.resetAllMocks();

        // Setup MongoDB mocks
        mockCollection = {
            deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 }),
            insertMany: jest.fn().mockResolvedValue({ insertedCount: 2 }),
            bulkWrite: jest.fn().mockResolvedValue({ insertedCount: 2 })
        } as unknown as jest.Mocked<Collection>;

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection)
        } as unknown as jest.Mocked<Db>;

        mockClient = {
            connect: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
            db: jest.fn().mockReturnValue(mockDb)
        } as unknown as jest.Mocked<MongoClient>;

        (MongoClient as unknown as jest.Mock).mockImplementation(() => mockClient);

        adapter = new MongoDBAdapter(mockConfig);
    });

    it('should connect to MongoDB', async () => {
        await adapter.connect();

        expect(MongoClient).toHaveBeenCalledWith(mockConfig.uri);
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.db).toHaveBeenCalledWith('testdb');
    });

    it('should disconnect from MongoDB', async () => {
        await adapter.connect();
        await adapter.disconnect();

        expect(mockClient.close).toHaveBeenCalled();
    });

    it('should clear data', async () => {
        const seeds: SeedData[] = [
            { name: 'users', data: [] },
            { name: 'products', data: [] }
        ];

        await adapter.connect();
        await adapter.clearData(seeds);

        expect(mockDb.collection).toHaveBeenCalledTimes(2);
        expect(mockDb.collection).toHaveBeenCalledWith('users');
        expect(mockDb.collection).toHaveBeenCalledWith('products');
        expect(mockCollection.deleteMany).toHaveBeenCalledTimes(2);
        expect(mockCollection.deleteMany).toHaveBeenCalledWith({});
    });

    it('should seed data with identity field', async () => {
        const seed: SeedData = {
            name: 'users',
            options: {
                identityField: 'email'
            },
            data: [
                { email: 'john@example.com', name: 'John' },
                { email: 'jane@example.com', name: 'Jane' }
            ]
        };

        await adapter.connect();
        const result = await adapter.seedData(seed);

        expect(result).toBe(2);
        expect(mockDb.collection).toHaveBeenCalledWith('users');
        expect(mockCollection.bulkWrite).toHaveBeenCalledWith([
            {
                updateOne: {
                    filter: { email: 'john@example.com' },
                    update: { $set: { email: 'john@example.com', name: 'John' } },
                    upsert: true
                }
            },
            {
                updateOne: {
                    filter: { email: 'jane@example.com' },
                    update: { $set: { email: 'jane@example.com', name: 'Jane' } },
                    upsert: true
                }
            }
        ]);
    });

    it('should seed data without identity field', async () => {
        const seed: SeedData = {
            name: 'products',
            data: [
                { id: 1, name: 'Product A' },
                { id: 2, name: 'Product B' }
            ]
        };

        await adapter.connect();
        const result = await adapter.seedData(seed);

        expect(result).toBe(2);
        expect(mockDb.collection).toHaveBeenCalledWith('products');
        expect(mockCollection.insertMany).toHaveBeenCalledWith([
            { id: 1, name: 'Product A' },
            { id: 2, name: 'Product B' }
        ]);
    });
});