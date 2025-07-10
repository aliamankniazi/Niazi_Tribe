const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function testInitSQL() {
  let connection;
  
  try {
    // Create connection
    console.log('Connecting to MySQL...');
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      multipleStatements: true // Important for running multiple SQL statements
    });

    console.log('✓ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${process.env.MYSQL_DATABASE || 'niazi_tribe_test'} 
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log('✓ Database created/verified');

    // Use the database
    await connection.query(`USE ${process.env.MYSQL_DATABASE || 'niazi_tribe_test'}`);

    // Read and execute the init.sql file
    const sqlPath = path.join(__dirname, 'migrations', 'init.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');
    
    // Execute the SQL
    await connection.query(sqlContent);
    console.log('✓ All tables created successfully');

    // Verify tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\nCreated tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // Verify admin user was created
    const [users] = await connection.query('SELECT id, email, username, role FROM users WHERE username = ?', ['admin']);
    if (users.length > 0) {
      console.log('\n✓ Admin user created:', users[0]);
    }

    // Test table structure
    const [columns] = await connection.query('DESCRIBE users');
    console.log('\nUsers table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    console.log('\n✅ All tests passed! The init.sql file is working correctly.');

  } catch (error) {
    console.error('\n❌ Error:', error.message || error);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  MySQL is not running!');
      console.error('\nPlease start MySQL using one of these methods:');
      console.error('1. Docker: docker-compose up -d mysql');
      console.error('2. Docker standalone: docker run -d --name mysql-niazi -p 3306:3306 -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=niazi_tribe mysql:8.0');
      console.error('3. Install MySQL locally: https://dev.mysql.com/downloads/installer/');
      console.error('\nSee MYSQL_INSTALLATION_GUIDE.md for detailed instructions.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n⚠️  Access denied! Check your MySQL credentials.');
      console.error('Current settings:');
      console.error(`- Host: ${process.env.MYSQL_HOST || 'localhost'}`);
      console.error(`- User: ${process.env.MYSQL_USER || 'root'}`);
      console.error(`- Password: ${process.env.MYSQL_PASSWORD ? '***' : '(not set)'}`);
    } else if (error.sql) {
      console.error('Failed SQL:', error.sql);
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connection closed');
    }
  }
}

// Run the test
console.log('Testing MySQL initialization script...\n');
testInitSQL(); 