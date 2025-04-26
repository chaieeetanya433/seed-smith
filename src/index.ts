// import { logger } from './utils/logger';
import { MongoDBAdapter } from './adapters/mongodb-adapter';
import { PostgresAdapter } from './adapters/postgres-adapter';
import { DatabaseConfig, SeederConfig } from './config/config-loader';
import { validateConfig } from './utils/validation';
import ora from 'ora';

const getAdapter = (dbConfig: DatabaseConfig) => {
  switch (dbConfig.type.toLowerCase()) {
    case 'mongodb':
      return new MongoDBAdapter(dbConfig);
    case 'postgres':
    case 'postgresql':
      return new PostgresAdapter(dbConfig);
    default:
      throw new Error(`Unsupported database type: ${dbConfig.type}`);
  }
};

export const runSeeder = async (config: SeederConfig): Promise<void> => {
  // Validate config
  validateConfig(config);

  const spinner = ora('Connecting to database...').start();

  try {
    // Connect to the database
    const adapter = getAdapter(config.database);
    await adapter.connect();
    spinner.succeed('Connected to database');

    // Clear collections/tables if specified
    if (config.options?.clearBeforeSeeding) {
      spinner.text = 'Clearing existing data...';
      await adapter.clearData(config.seeds);
      spinner.succeed('Cleared existing data');
    }

    // Seed the data
    spinner.text = 'Seeding database...';
    for (const seed of config.seeds) {
      const recordCount = await adapter.seedData(seed);
      console.log(seed, 'seed data');
      spinner.succeed(`Seeded ${recordCount} records into ${seed.name}`);
    }

    // Disconnect from the database
    await adapter.disconnect();
    spinner.succeed('Database seeding completed');
  } catch (error) {
    spinner.fail(`Seeding failed: ${(error as Error).message}`);
    throw error;
  }
};

export { SeederConfig, DatabaseConfig } from './config/config-loader';
