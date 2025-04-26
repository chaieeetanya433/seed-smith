# 🌱 db-seed

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)

> A powerful, flexible CLI tool for effortlessly seeding databases from YAML or JSON configuration files. Perfect for development, testing environments, and CI/CD pipelines.

<p align="center">
  <img src="/api/placeholder/800/400" alt="db-seed visualization" />
</p>

## ✨ Features

- **Multi-database Support**: Seamlessly works with MongoDB and PostgreSQL
- **Simple Configuration**: Easy-to-write YAML or JSON configuration files
- **Environment Variables**: Built-in support for environment variable substitution
- **Intelligent Updates**: Identity field support for smart upserts
- **Data Management**: Options to clear existing data before seeding
- **Safety First**: Dry-run mode to validate configurations without modifying databases
- **Performance Optimized**: Efficiently handles large datasets with bulk operations

## 🚀 Quick Start

```bash
# Install globally
npm install -g db-seed

# Run with your config
db-seed --config seed-config.yml
```

## 📋 Installation Options

### Global Installation

Makes db-seed available across all your projects:

```bash
npm install -g db-seed
```

### Project Installation

Install as a development dependency in your current project:

```bash
npm install --save-dev db-seed
```

### Running with npx

Use without installation:

```bash
npx db-seed --config seed-config.yml
```

## 🛠️ Command Line Options

```
Options:
  -c, --config <path>   Path to the configuration file (YAML or JSON)
  -e, --env <path>      Path to .env file (default: .env)
  --dry-run             Validate the configuration without seeding the database
  -v, --verbose         Enable verbose logging
  -h, --help            display help for command
```

## 📝 Configuration Examples

### MongoDB Example

```yaml
database:
  type: mongodb
  uri: ${MONGODB_URI}
  # Alternatively, you can specify components separately:
  # host: localhost
  # port: 27017
  # username: user
  # password: pass
  # database: testdb

options:
  clearBeforeSeeding: true

seeds:
  - name: users
    options:
      identityField: email
    data:
      - name: John Doe
        email: john@example.com
        role: admin
        createdAt: "2023-08-15T00:00:00Z"
      - name: Jane Smith
        email: jane@example.com
        role: user
        createdAt: "2023-08-16T00:00:00Z"
  
  - name: products
    data:
      - name: Product A
        price: 19.99
        category: electronics
        inStock: true
      - name: Product B
        price: 29.99
        category: furniture
        inStock: false
```

### PostgreSQL Example

```yaml
database:
  type: postgresql
  host: ${PG_HOST}
  port: 5432
  username: ${PG_USER}
  password: ${PG_PASSWORD}
  database: ${PG_DATABASE}

options:
  clearBeforeSeeding: true

seeds:
  - name: users
    options:
      identityField: email
    data:
      - id: 1
        name: John Doe
        email: john@example.com
        role: admin
        created_at: "2023-08-15 00:00:00"
      - id: 2
        name: Jane Smith
        email: jane@example.com
        role: user
        created_at: "2023-08-16 00:00:00"
  
  - name: products
    data:
      - id: 1
        name: Product A
        price: 19.99
        category: electronics
        in_stock: true
      - id: 2
        name: Product B
        price: 29.99
        category: furniture
        in_stock: false
```

## 🔄 Environment Variables

Use environment variables in your configuration files with the `${VARIABLE_NAME}` syntax for secure credential management and environment-specific configurations.

Example `.env` file:

```
MONGODB_URI=mongodb://localhost:27017/testdb
PG_HOST=localhost
PG_USER=postgres
PG_PASSWORD=secret
PG_DATABASE=testdb
```

## 📊 Configuration Reference

### Database Configuration

| Option       | Description                             | Required | Default     |
|:-------------|:----------------------------------------|:---------|:------------|
| `type`       | Database type (`mongodb` or `postgres`) | Yes      | -           |
| `uri`        | Connection URI (MongoDB only)           | No*      | -           |
| `host`       | Database host                           | No*      | `localhost` |
| `port`       | Database port                           | No       | Default port|
| `username`   | Database username                       | No       | -           |
| `password`   | Database password                       | No       | -           |
| `database`   | Database name                           | Yes**    | -           |
| `options`    | Additional connection options           | No       | -           |

\* Either `uri` or `host` must be provided for MongoDB  
\** Required for PostgreSQL

### Seed Configuration

| Option         | Description                           | Required | Default |
|:---------------|:--------------------------------------|:---------|:--------|
| `name`         | Collection/Table name                 | Yes      | -       |
| `data`         | Array of records to seed              | Yes      | -       |
| `options`      | Additional options                    | No       | -       |
| `identityField`| Field to use for upsert operations    | No       | -       |

### Global Options

| Option                | Description                         | Default |
|:----------------------|:------------------------------------|:--------|
| `clearBeforeSeeding`  | Clear existing data before seeding  | `false` |

## 💡 Common Use Cases

### Testing Environments

```bash
NODE_ENV=test db-seed --config test-data.yml
```

### CI/CD Pipelines

```bash
# In your CI workflow
db-seed --config ci-seed.yml --env .env.ci
```

### Development Setup

```bash
# Add to your package.json scripts
"setup:dev": "db-seed --config dev-seed.yml"
```

## 🔍 Troubleshooting

### Connection Issues

If you're experiencing connection issues, try using the `--verbose` flag to get more detailed logs:

```bash
db-seed --config seed-config.yml --verbose
```

### Data Not Being Updated

When using identity fields, ensure that your data objects contain the specified identity field and that it has a unique value.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  Made with ❤️ for developers who value clean, testable data
</p>
