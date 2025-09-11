const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function runMigrations() {
  try {
    console.log('Starting database migration...');
    
    const migrationsDir = path.join(__dirname, '../config/migrations');
    let migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Allow running a subset: via CLI arg or env
    // Usage examples:
    //  node utils/migrate.js 007              -> runs files that include '007'
    //  node utils/migrate.js from=007         -> runs files >= '007'
    //  MIGRATE_ONLY=007_add_x.sql npm run migrate
    //  MIGRATE_FROM=007 npm run migrate
    const args = process.argv.slice(2);
    const onlyArg = process.env.MIGRATE_ONLY || (args.find(a => !a.includes('=')) || '');
    const fromArg = process.env.MIGRATE_FROM || (args.find(a => a.startsWith('from='))?.split('=')[1] || '');

    if (onlyArg) {
      migrationFiles = migrationFiles.filter(f => f.includes(onlyArg));
    } else if (fromArg) {
      migrationFiles = migrationFiles.filter(f => f >= fromArg);
    }
    
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
