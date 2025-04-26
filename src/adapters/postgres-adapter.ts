import { Pool, PoolClient } from 'pg';
import { BaseAdapter } from './base-adapter';
import { DatabaseConfig, SeedData } from '../config/config-loader';
import { logger } from '../utils/logger';

export class PostgresAdapter extends BaseAdapter {
  private pool: Pool | null = null;
  private client: PoolClient | null = null;

  constructor(config: DatabaseConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    try {
      this.pool = new Pool({
        host: this.config.host || 'localhost',
        port: this.config.port || 5432,
        user: this.config.username,
        password: this.config.password,
        database: this.config.database,
        ...this.config.options,
      });

      this.client = await this.pool.connect();
      logger.debug(`Connected to PostgreSQL: ${this.config.database}`);
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${(error as Error).message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }

    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.debug('Disconnected from PostgreSQL');
    }
  }

  async clearData(seeds: SeedData[]): Promise<void> {
    if (!this.client) {
      throw new Error('PostgreSQL connection not established');
    }

    try {
      // Start a transaction
      await this.client.query('BEGIN');

      for (const seed of seeds) {
        await this.client.query(`TRUNCATE TABLE ${seed.name} CASCADE`);
        logger.debug(`Cleared table: ${seed.name}`);
      }

      // Commit the transaction
      await this.client.query('COMMIT');
    } catch (error) {
      // Rollback in case of error
      if (this.client) {
        await this.client.query('ROLLBACK');
      }
      throw new Error(`Failed to clear tables: ${(error as Error).message}`);
    }
  }

  async seedData(seed: SeedData): Promise<number> {
    if (!this.client) {
      throw new Error('PostgreSQL connection not established');
    }

    if (!seed.data || !Array.isArray(seed.data) || seed.data.length === 0) {
      logger.warn(`No data to seed for table: ${seed.name}`);
      return 0;
    }

    try {
      // Start a transaction
      await this.client.query('BEGIN');

      let insertedCount = 0;

      // Get column names from the first record
      const columnNames = Object.keys(seed.data[0]);

      for (const item of seed.data) {
        const values = columnNames.map(column => item[column]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        // If identity field is specified, perform an upsert
        if (seed.options?.identityField) {
          const updateColumns = columnNames
            .filter(col => col !== seed.options?.identityField)
            .map((col, i) => `${col} = $${i + 2}`)
            .join(', ');

          // const identityValue = item[seed.options.identityField];
          const identityIdx = columnNames.indexOf(seed.options.identityField);

          // If identity field exists, perform an upsert
          if (identityIdx !== -1) {
            const query = `
              INSERT INTO ${seed.name} (${columnNames.join(', ')})
              VALUES (${placeholders})
              ON CONFLICT (${seed.options.identityField})
              DO UPDATE SET ${updateColumns}
            `;

            await this.client.query(query, values);
            insertedCount++;
          }
        } else {
          // Simple insert
          const query = `
            INSERT INTO ${seed.name} (${columnNames.join(', ')})
            VALUES (${placeholders})
          `;

          await this.client.query(query, values);
          insertedCount++;
        }
      }

      // Commit the transaction
      await this.client.query('COMMIT');

      logger.debug(`Seeded ${insertedCount} rows into table: ${seed.name}`);
      return insertedCount;
    } catch (error) {
      // Rollback in case of error
      if (this.client) {
        await this.client.query('ROLLBACK');
      }
      throw new Error(`Failed to seed table ${seed.name}: ${(error as Error).message}`);
    }
  }
}
