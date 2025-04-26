import { DatabaseConfig, SeedData } from '../config/config-loader';

export abstract class BaseAdapter {
  protected config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;

  abstract disconnect(): Promise<void>;

  abstract clearData(seeds: SeedData[]): Promise<void>;

  abstract seedData(seed: SeedData): Promise<number>;
}
