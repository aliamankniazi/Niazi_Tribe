# Database Migrations

## About init.sql

The `init.sql` file contains the initial MySQL database schema for the Niazi Tribe application. 

### Important Notes

1. **Linter Warnings**: You may see SQL linter warnings in your IDE. These are **false positives** because most IDEs default to SQL Server or generic SQL syntax checking. The file uses **MySQL-specific syntax** which is correct.

2. **MySQL Version**: This schema is designed for MySQL 8.0+ and uses:
   - `utf8mb4` character set for full Unicode support (including emojis)
   - InnoDB storage engine for foreign key support
   - JSON data type for flexible metadata storage

3. **Testing the Schema**: To test if the SQL works correctly:
   ```bash
   cd apps/api
   npm run test:db
   ```

   Or manually:
   ```bash
   mysql -u your_user -p your_database < src/database/migrations/init.sql
   ```

### Schema Overview

The database includes the following tables:

- **users**: User accounts and authentication
- **sessions**: User sessions and refresh tokens  
- **media**: File uploads and media management
- **user_settings**: User preferences and settings
- **activity_logs**: Audit trail of user actions
- **notifications**: User notifications
- **password_reset_tokens**: Password reset functionality
- **email_verifications**: Email verification tokens

### Default Admin User

The schema creates a default admin user:
- Email: `admin@niazitribe.com`
- Username: `admin`
- Password: `