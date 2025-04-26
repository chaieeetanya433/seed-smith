import { SeederConfig, SeedData, DatabaseConfig } from '../config/config-loader';

export const validateConfig = (config: SeederConfig): void => {
  // Validate database configuration
  validateDatabaseConfig(config.database);

  // Validate seeds
  if (!config.seeds || !Array.isArray(config.seeds) || config.seeds.length === 0) {
    throw new Error('No seeds defined in the configuration');
  }

  // Validate each seed
  config.seeds.forEach(validateSeed);
};

const validateDatabaseConfig = (dbConfig: DatabaseConfig): void => {
  if (!dbConfig) {
    throw new Error('Database configuration is missing');
  }

  if (!dbConfig.type) {
    throw new Error('Database type is required');
  }

  const type = dbConfig.type.toLowerCase();

  if (type !== 'mongodb' && type !== 'postgres' && type !== 'postgresql') {
    throw new Error(`Unsupported database type: ${dbConfig.type}`);
  }

  // Validate MongoDB configuration
  if (type === 'mongodb') {
    if (!dbConfig.uri && (!dbConfig.host || !dbConfig.database)) {
      throw new Error('MongoDB requires either URI or host and database name');
    }
  }

  // Validate PostgreSQL configuration
  if (type === 'postgres' || type === 'postgresql') {
    if (!dbConfig.database) {
      throw new Error('PostgreSQL requires a database name');
    }
  }
};

const validateSeed = (seed: SeedData, index: number): void => {
  if (!seed.name) {
    throw new Error(`Seed at index ${index} is missing a name (collection/table)`);
  }

  if (!seed.data) {
    throw new Error(`Seed "${seed.name}" is missing data`);
  }

  if (!Array.isArray(seed.data)) {
    throw new Error(`Seed "${seed.name}" data must be an array`);
  }

  // Validate identity field if specified
  if (seed.options?.identityField) {
    for (const [idx, item] of seed.data.entries()) {
      if (!item[seed.options.identityField]) {
        throw new Error(
          `Item at index ${idx} in seed "${seed.name}" is missing the identity field "${seed.options.identityField}"`
        );
      }
    }
  }
};
