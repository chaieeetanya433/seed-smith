import { Command } from 'commander';
import { runSeeder } from './index';
import { loadConfig } from './config/config-loader';
import { logger } from './utils/logger';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs-extra';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('db-seed')
  .description('A CLI tool to seed databases from YAML or JSON files')
  .version('1.0.0');

program
  .option('-c, --config <path>', 'Path to the configuration file (YAML or JSON)')
  .option('-e, --env <path>', 'Path to .env file', '.env')
  .option('--dry-run', 'Validate the configuration without seeding the database')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async options => {
    try {
      // Load environment variables from specified .env file
      if (options.env && fs.existsSync(options.env)) {
        dotenv.config({ path: options.env });
      }

      if (!options.config) {
        logger.error('Configuration file is required. Use --config option.');
        process.exit(1);
      }

      const configPath = path.resolve(process.cwd(), options.config);
      if (!fs.existsSync(configPath)) {
        logger.error(`Configuration file not found: ${options.config}`);
        process.exit(1);
      }

      // Set log level
      if (options.verbose) {
        logger.setVerbose(true);
      }

      // Load and validate configuration
      const config = await loadConfig(configPath);

      if (options.dryRun) {
        logger.info('Dry run completed. Configuration is valid.');
        return;
      }

      // Run the seeder
      await runSeeder(config);
      logger.success('Database seeding completed successfully!');
    } catch (error) {
      logger.error(`Failed to seed database: ${(error as Error).message}`);
      if (options.verbose) {
        console.error(error);
      }
      process.exit(1);
    }
  });

program.parse();
