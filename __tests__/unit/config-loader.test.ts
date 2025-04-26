import { loadConfig, parseEnvVarsInObject, resolveEnvVars } from '../../src/config/config-loader';
import path from 'path';
import fs from 'fs-extra';

// Mock fs.readFile
jest.mock('fs-extra');

describe('Config Loader', () => {
    beforeEach(() => {
        // Reset environment variables
        process.env = {};
        jest.resetAllMocks();
    });

    describe('resolveEnvVars', () => {
        it('should replace environment variables in a string', () => {
            process.env.TEST_VAR = 'test-value';
            const result = resolveEnvVars('This is a ${TEST_VAR}');
            expect(result).toBe('This is a test-value');
        });

        it('should leave the string unchanged if environment variable is not defined', () => {
            const result = resolveEnvVars('This is a ${UNDEFINED_VAR}');
            expect(result).toBe('This is a ${UNDEFINED_VAR}');
        });
    });

    describe('parseEnvVarsInObject', () => {
        it('should replace environment variables in object values', () => {
            process.env.DB_HOST = 'localhost';
            process.env.DB_PORT = '5432';

            const obj = {
                host: '${DB_HOST}',
                port: '${DB_PORT}',
                options: {
                    ssl: true,
                    connectionString: 'postgres://${DB_HOST}:${DB_PORT}/db'
                }
            };

            const result = parseEnvVarsInObject(obj);

            expect(result).toEqual({
                host: 'localhost',
                port: '5432',
                options: {
                    ssl: true,
                    connectionString: 'postgres://localhost:5432/db'
                }
            });
        });
    });

    describe('loadConfig', () => {
        it('should load and parse YAML configuration file', async () => {
            const yamlContent = `
database:
  type: mongodb
  uri: mongodb://localhost:27017/test
seeds:
  - name: users
    data:
      - name: John
        email: john@example.com
      `;

            (fs.readFile as unknown as jest.Mock).mockResolvedValue(yamlContent);

            const configPath = path.join(__dirname, 'config.yml');
            const config = await loadConfig(configPath);

            expect(config).toEqual({
                database: {
                    type: 'mongodb',
                    uri: 'mongodb://localhost:27017/test'
                },
                seeds: [
                    {
                        name: 'users',
                        data: [
                            {
                                name: 'John',
                                email: 'john@example.com'
                            }
                        ]
                    }
                ]
            });
        });

        it('should load and parse JSON configuration file', async () => {
            const jsonContent = JSON.stringify({
                database: {
                    type: 'postgresql',
                    host: 'localhost',
                    port: 5432,
                    database: 'testdb'
                },
                seeds: [
                    {
                        name: 'products',
                        data: [
                            {
                                id: 1,
                                name: 'Product A'
                            }
                        ]
                    }
                ]
            });

            (fs.readFile as unknown as jest.Mock).mockResolvedValue(jsonContent);

            const configPath = path.join(__dirname, 'config.json');
            const config = await loadConfig(configPath);

            expect(config).toEqual({
                database: {
                    type: 'postgresql',
                    host: 'localhost',
                    port: 5432,
                    database: 'testdb'
                },
                seeds: [
                    {
                        name: 'products',
                        data: [
                            {
                                id: 1,
                                name: 'Product A'
                            }
                        ]
                    }
                ]
            });
        });

        it('should throw an error for unsupported file format', async () => {
            (fs.readFile as unknown as jest.Mock).mockResolvedValue('some content');

            const configPath = path.join(__dirname, 'config.txt');
            await expect(loadConfig(configPath)).rejects.toThrow('Unsupported configuration file format');
        });
    });
});