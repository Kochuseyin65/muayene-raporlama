const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    
    const migrationsDir = path.join(__dirname, '../config/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      await pool.query(sqlContent);
      console.log(`✓ Migration ${file} completed`);
    }
    
    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

if (require.main === module) {
  (async () => {
    try {
      const connected = await testConnection();
      if (connected) {
        await runMigrations();
      }
    } catch (error) {
      console.error('Migration script failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}

module.exports = { runMigrations, testConnection };