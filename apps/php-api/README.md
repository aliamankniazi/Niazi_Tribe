# Niazi-Tribe PHP API

A lightweight PHP API for managing genealogical data and family trees.

## Features

- User authentication and authorization
- Family tree management with privacy settings
- Person and relationship management
- Tree sharing with different access levels
- Data export in multiple formats (JSON, XML, CSV, GEDCOM)
- Tree statistics and analytics
- Duplicate person detection and merging
- Admin dashboard with system monitoring
- Rate limiting and security measures
- Comprehensive logging system
- Performance monitoring and health checks

## Security Features

- CORS protection
- Security headers (XSS, CSRF, etc.)
- Input sanitization
- Rate limiting
- Token validation
- Password strength requirements
- SQL injection prevention
- Session management
- Access control
- Request logging and monitoring
- File permission checks
- SSL/TLS verification
- Failed login tracking

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user
- `POST /auth/reset-password` - Request password reset
- `POST /auth/change-password` - Change password

### Family Trees
- `GET /trees` - List user's trees
- `POST /trees` - Create new tree
- `GET /trees/:id` - Get tree details
- `PUT /trees/:id` - Update tree
- `DELETE /trees/:id` - Delete tree
- `POST /trees/:id/share` - Share tree with user
- `GET /trees/:id/stats` - Get tree statistics
- `GET /trees/:id/export/:format` - Export tree (json/xml/csv/gedcom)
- `GET /trees/:id/duplicates` - Find possible duplicates
- `POST /trees/:id/merge` - Merge duplicate persons

### Persons
- `GET /trees/:treeId/persons` - List persons in tree
- `POST /trees/:treeId/persons` - Add person to tree
- `GET /trees/:treeId/persons/:id` - Get person details
- `PUT /trees/:treeId/persons/:id` - Update person
- `DELETE /trees/:treeId/persons/:id` - Delete person
- `POST /trees/:treeId/persons/:id/relationships` - Add relationship
- `DELETE /trees/:treeId/persons/:id/relationships/:relationshipId` - Remove relationship

### Admin
- `GET /admin/stats` - Get system statistics
- `GET /admin/health` - Get system health status
- `GET /admin/performance` - Get performance metrics
- `POST /admin/logs/cleanup` - Clean old logs
- `GET /admin/users/:id/activity` - Get user activity
- `GET /admin/errors` - Get error report

## System Health Monitoring

The `/admin/health` endpoint provides:
- Component status (database, Redis, disk, logs)
- Performance metrics
- Security checks
- System resources
- Response times
- Error rates

Components monitored:
- Database connection and latency
- Redis connection and latency
- Disk space usage
- Log file sizes
- PHP worker count
- Memory usage
- System load

Security checks:
- SSL/TLS status
- File permissions
- Session configuration
- Failed login attempts
- Rate limit breaches

## Performance Monitoring

The `/admin/performance` endpoint provides:
- Daily request statistics
- Slow endpoint identification
- Error distribution
- System metrics
- Resource usage
- Query performance
- Active sessions

Metrics tracked:
- Response times
- Request counts
- Error rates
- Memory usage
- CPU load
- Disk I/O
- Network traffic

## Request Logging

Every request is logged with:
- Request ID (X-Request-ID header)
- Method and endpoint
- Query parameters
- IP address
- User agent
- Response time
- Status code
- Response size
- User ID (if authenticated)

Special logging for:
- Slow requests (>1s)
- Error responses (5xx)
- Rate limit breaches
- Security violations

## Rate Limiting

Default limits:
- 60 requests per minute per IP
- 10 failed login attempts per hour
- 5 password reset requests per day
- 10 exports per hour per user

## Data Export Formats

### JSON
- Complete tree data
- Nested relationships
- Full person details
- Metadata included

### XML
- Standard XML format
- Validates against schema
- Includes all relationships
- Preserves data types

### CSV
- Separate person and relationship files
- UTF-8 encoded
- Headers included
- Import-friendly format

### GEDCOM
- Standard 5.5.1 format
- Full genealogical data
- Compatible with family tree software
- Includes all relationships

## Installation

1. Clone the repository
2. Copy `.env.example` to `.env`
3. Configure database settings in `.env`
4. Run `composer install`
5. Run database migrations
6. Configure web server (Apache/Nginx)
7. Set up Redis for rate limiting
8. Configure logging directory permissions

## Configuration

Key configuration files:
- `config/database.php` - Database settings
- `config/app.php` - Application settings
- `config/security.php` - Security settings
- `config/logging.php` - Logging settings
- `config/redis.php` - Redis settings

## Development

Requirements:
- PHP 8.0+
- MySQL/MariaDB
- Redis (for rate limiting)
- Composer

## Testing

Run tests with:
```bash
composer test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Run tests
5. Submit pull request

## License

MIT License 