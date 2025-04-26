import fs from 'fs-extra';
import YAML from 'yaml';
import path from 'path';
import { logger } from '../utils/logger';

export interface SeedData {
  name: string;
  data: Record<string, any>[];
  options?: {
    identityField?: string;
  };
}

export interface DatabaseConfig {
  type: string;
  uri?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  options?: Record<string, any>;
}

export interface SeederConfig {
  database: DatabaseConfig;
  seeds: SeedData[];
  options?: {
    clearBeforeSeeding?: boolean;
  };
}

export const resolveEnvVars = (value: string): string => {
  return value.replace(/\${([^}]+)}/g, (match, envVar) => {
    const resolved = process.env[envVar];
    if (resolved === undefined) {
      logger.warn(`Environment variable ${envVar} is not defined`);
      return match;
    }
    return resolved;
  });
};

export const parseEnvVarsInObject = (obj: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = resolveEnvVars(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item =>
        typeof item === 'object' && item !== null ? parseEnvVarsInObject(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = parseEnvVarsInObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};

export const loadConfig = async (configPath: string): Promise<SeederConfig> => {
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8');
    const extension = path.extname(configPath).toLowerCase();

    let config: SeederConfig;

    if (extension === '.yml' || extension === '.yaml') {
      config = YAML.parse(fileContent);
    } else if (extension === '.json') {
      config = JSON.parse(fileContent);
    } else {
      throw new Error(`Unsupported configuration file format: ${extension}`);
    }

    // Process environment variables in the configuration
    config = parseEnvVarsInObject(config) as SeederConfig;

    return config;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${(error as Error).message}`);
  }
};
