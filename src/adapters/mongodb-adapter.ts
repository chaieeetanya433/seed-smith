import { MongoClient, Db } from 'mongodb';
import { BaseAdapter } from './base-adapter';
import { DatabaseConfig, SeedData } from '../config/config-loader';
import { logger } from '../utils/logger';

export class MongoDBAdapter extends BaseAdapter {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  
  constructor(config: DatabaseConfig) {
    super(config);
  }
  
  async connect(): Promise<void> {
    try {
      const uri = this.config.uri || this.buildConnectionString();
      this.client = new MongoClient(uri);
      await this.client.connect();
      
      // Important fix: Extract database name from URI if present, otherwise use the database property
      let dbName: string | undefined;
      
      if (this.config.uri) {
        // Parse database name from URI if present
        const uriObj = new URL(this.config.uri);
        const pathSegments = uriObj.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          dbName = pathSegments[0];
        }
      }
      
      // Fall back to the database property if URI doesn't contain a database name
      dbName = dbName || this.config.database || 'test';
      
      this.db = this.client.db(dbName);
      logger.debug(`Connected to MongoDB database: ${dbName}`);
    } catch (error) {
      throw new Error(`Failed to connect to MongoDB: ${(error as Error).message}`);
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      logger.debug('Disconnected from MongoDB');
    }
  }
  
  async clearData(seeds: SeedData[]): Promise<void> {
    if (!this.db) {
      throw new Error('MongoDB connection not established');
    }
    
    for (const seed of seeds) {
      try {
        await this.db.collection(seed.name).deleteMany({});
        logger.debug(`Cleared collection: ${seed.name}`);
      } catch (error) {
        throw new Error(`Failed to clear collection ${seed.name}: ${(error as Error).message}`);
      }
    }
  }
  
  async seedData(seed: SeedData): Promise<number> {
    if (!this.db) {
      throw new Error('MongoDB connection not established');
    }
    
    if (!seed.data || !Array.isArray(seed.data) || seed.data.length === 0) {
      logger.warn(`No data to seed for collection: ${seed.name}`);
      return 0;
    }
    
    try {
      const collection = this.db.collection(seed.name);
      
      // If identity field is specified, perform upsert with that as the key
      if (seed.options?.identityField) {
        const operations = seed.data.map(item => {
          const filter = { [seed.options!.identityField!]: item[seed.options!.identityField!] };
          return {
            updateOne: {
              filter,
              update: { $set: item },
              upsert: true
            }
          };
        });
        
        if (operations.length > 0) {
          await collection.bulkWrite(operations);
        }
      } else {
        // Otherwise just insert the data
        await collection.insertMany(seed.data);
      }
      
      logger.debug(`Seeded ${seed.data.length} documents into collection: ${seed.name}`);
      return seed.data.length;
    } catch (error) {
      throw new Error(`Failed to seed collection ${seed.name}: ${(error as Error).message}`);
    }
  }
  
  private buildConnectionString(): string {
    const { username, password, host, port, database, options } = this.config;
    
    // Build connection string
    let uri = 'mongodb://';
    
    // Add credentials if provided
    if (username && password) {
      uri += `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`;
    }
    
    // Add host and port
    uri += `${host || 'localhost'}:${port || 27017}`;
    
    // Add database if provided
    if (database) {
      uri += `/${database}`;
    }
    
    // Add options if provided
    if (options) {
      const optionsStr = Object.entries(options)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      if (optionsStr) {
        uri += `?${optionsStr}`;
      }
    }
    
    return uri;
  }
}