<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../includes/Logger.php';

class AdminController extends BaseController {
    private $logger;

    public function __construct() {
        parent::__construct();
        $this->logger = Logger::getInstance();
    }

    private function requireAdmin() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $user = $this->auth->getCurrentUser();
        if (!$user || $user['role'] !== 'admin') {
            return $this->error('Admin access required', 403);
        }

        return true;
    }

    public function getSystemStats() {
        $auth = $this->requireAdmin();
        if ($auth !== true) return $auth;

        $db = Database::getInstance();
        
        // Get counts
        $userCount = $db->query("SELECT COUNT(*) as count FROM users")->fetch()['count'];
        $treeCount = $db->query("SELECT COUNT(*) as count FROM family_trees")->fetch()['count'];
        $personCount = $db->query("SELECT COUNT(*) as count FROM persons")->fetch()['count'];
        
        // Get recent activity
        $recentLogs = $this->logger->getRecentLogs(60); // Last hour
        $recentErrors = $this->logger->getErrorLogs(10); // Last 10 errors

        // Get system info
        $systemInfo = [
            'php_version' => PHP_VERSION,
            'memory_usage' => memory_get_usage(true),
            'peak_memory_usage' => memory_get_peak_usage(true),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'database_size' => $this->getDatabaseSize()
        ];

        return $this->response([
            'counts' => [
                'users' => $userCount,
                'trees' => $treeCount,
                'persons' => $personCount
            ],
            'recent_activity' => $recentLogs,
            'recent_errors' => $recentErrors,
            'system_info' => $systemInfo
        ]);
    }

    public function cleanupLogs() {
        $auth = $this->requireAdmin();
        if ($auth !== true) return $auth;

        try {
            $this->logger->cleanOldLogs(30); // Keep last 30 days
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    private function getDatabaseSize() {
        $db = Database::getInstance();
        $dbName = require __DIR__ . '/../config/database.php';
        $dbName = $dbName['database'];

        $result = $db->query("
            SELECT 
                SUM(data_length + index_length) as size 
            FROM information_schema.tables 
            WHERE table_schema = ?
            GROUP BY table_schema
        ", [$dbName])->fetch();

        return $result ? $result['size'] : 0;
    }

    public function getUserActivity($userId) {
        $auth = $this->requireAdmin();
        if ($auth !== true) return $auth;

        $db = Database::getInstance();
        
        // Get user's trees
        $trees = $db->query(
            "SELECT * FROM family_trees WHERE owner_id = ?",
            [$userId]
        )->fetchAll();

        // Get user's shared trees
        $sharedTrees = $db->query(
            "SELECT ft.*, ta.access_level 
            FROM family_trees ft 
            JOIN tree_access ta ON ft.id = ta.tree_id 
            WHERE ta.user_id = ?",
            [$userId]
        )->fetchAll();

        // Get recent modifications
        $recentActivity = $db->query(
            "SELECT * FROM (
                SELECT 'person' as type, first_name, last_name, created_at, updated_at 
                FROM persons 
                WHERE tree_id IN (SELECT id FROM family_trees WHERE owner_id = ?)
                UNION ALL
                SELECT 'relationship' as type, 
                       CONCAT(p1.first_name, ' ', p1.last_name) as first_name,
                       CONCAT(p2.first_name, ' ', p2.last_name) as last_name,
                       r.created_at,
                       r.created_at as updated_at
                FROM relationships r
                JOIN persons p1 ON r.person1_id = p1.id
                JOIN persons p2 ON r.person2_id = p2.id
                WHERE r.tree_id IN (SELECT id FROM family_trees WHERE owner_id = ?)
            ) activity
            ORDER BY created_at DESC
            LIMIT 50",
            [$userId, $userId]
        )->fetchAll();

        return $this->response([
            'owned_trees' => $trees,
            'shared_trees' => $sharedTrees,
            'recent_activity' => $recentActivity
        ]);
    }

    public function getErrorReport() {
        $auth = $this->requireAdmin();
        if ($auth !== true) return $auth;

        $errors = $this->logger->getErrorLogs(100);
        $errorsByType = [];
        
        foreach ($errors as $error) {
            $type = $this->parseErrorType($error);
            if (!isset($errorsByType[$type])) {
                $errorsByType[$type] = ['count' => 0, 'examples' => []];
            }
            
            $errorsByType[$type]['count']++;
            if (count($errorsByType[$type]['examples']) < 3) {
                $errorsByType[$type]['examples'][] = $error;
            }
        }

        return $this->response([
            'total_errors' => count($errors),
            'errors_by_type' => $errorsByType
        ]);
    }

    private function parseErrorType($errorLog) {
        // Extract error type from log message
        if (preg_match('/\[ERROR\].*?(\w+Exception|Error):/', $errorLog, $matches)) {
            return $matches[1];
        }
        return 'Unknown';
    }

    public function getSystemHealth() {
        $auth = $this->requireAdmin();
        if ($auth !== true) return $auth;

        $health = [
            'status' => 'healthy',
            'components' => [],
            'checks' => [],
            'metrics' => []
        ];

        // Check database connection
        try {
            $db = Database::getInstance();
            $start = microtime(true);
            $db->query("SELECT 1")->fetch();
            $dbLatency = (microtime(true) - $start) * 1000;
            
            $health['components']['database'] = [
                'status' => 'healthy',
                'latency_ms' => round($dbLatency, 2)
            ];
        } catch (Exception $e) {
            $health['status'] = 'unhealthy';
            $health['components']['database'] = [
                'status' => 'unhealthy',
                'error' => $e->getMessage()
            ];
        }

        // Check Redis connection
        try {
            $redis = new Redis();
            $start = microtime(true);
            $redis->connect('127.0.0.1', 6379);
            $redis->ping();
            $redisLatency = (microtime(true) - $start) * 1000;
            
            $health['components']['redis'] = [
                'status' => 'healthy',
                'latency_ms' => round($redisLatency, 2)
            ];
        } catch (Exception $e) {
            $health['components']['redis'] = [
                'status' => 'degraded',
                'error' => $e->getMessage()
            ];
        }

        // Check disk space
        $diskFree = disk_free_space('/');
        $diskTotal = disk_total_space('/');
        $diskUsedPercent = round(($diskTotal - $diskFree) / $diskTotal * 100, 2);
        
        $health['components']['disk'] = [
            'status' => $diskUsedPercent > 90 ? 'warning' : 'healthy',
            'free_space' => $diskFree,
            'total_space' => $diskTotal,
            'used_percent' => $diskUsedPercent
        ];

        // Check log files
        $logPath = __DIR__ . '/../logs/';
        $logFiles = glob($logPath . '*.log');
        $totalLogSize = 0;
        foreach ($logFiles as $file) {
            $totalLogSize += filesize($file);
        }
        
        $health['components']['logs'] = [
            'status' => $totalLogSize > 1024 * 1024 * 100 ? 'warning' : 'healthy', // Warning if > 100MB
            'total_size' => $totalLogSize,
            'file_count' => count($logFiles)
        ];

        // Performance metrics
        $health['metrics'] = $this->getPerformanceMetrics();

        // Security checks
        $health['checks'] = $this->runSecurityChecks();

        return $this->response($health);
    }

    private function getPerformanceMetrics() {
        $db = Database::getInstance();
        
        // Query performance
        $slowQueries = $db->query("
            SELECT COUNT(*) as count 
            FROM information_schema.processlist 
            WHERE time > 10
        ")->fetch()['count'];

        // Active sessions
        $activeSessions = $db->query("
            SELECT COUNT(*) as count 
            FROM sessions 
            WHERE last_activity > ?
        ", [time() - 3600])->fetch()['count'];

        // Recent errors
        $recentErrors = count($this->logger->getErrorLogs(60)); // Last hour

        // System load
        $load = sys_getloadavg();
        
        return [
            'slow_queries' => $slowQueries,
            'active_sessions' => $activeSessions,
            'errors_per_hour' => $recentErrors,
            'system_load' => [
                '1min' => $load[0],
                '5min' => $load[1],
                '15min' => $load[2]
            ],
            'memory_usage' => [
                'used' => memory_get_usage(true),
                'peak' => memory_get_peak_usage(true)
            ],
            'php_workers' => $this->getPhpWorkerCount()
        ];
    }

    private function runSecurityChecks() {
        $checks = [];

        // Check SSL/TLS configuration
        $checks['ssl'] = [
            'status' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'pass' : 'fail',
            'details' => isset($_SERVER['HTTPS']) ? 'HTTPS enabled' : 'HTTPS not enabled'
        ];

        // Check file permissions
        $configPath = __DIR__ . '/../config/';
        $configPerms = fileperms($configPath);
        $checks['file_permissions'] = [
            'status' => ($configPerms & 0x0004) ? 'fail' : 'pass',
            'details' => 'Configuration directory permissions: ' . substr(sprintf('%o', $configPerms), -4)
        ];

        // Check session configuration
        $checks['session_security'] = [
            'status' => 'info',
            'details' => [
                'cookie_secure' => ini_get('session.cookie_secure'),
                'cookie_httponly' => ini_get('session.cookie_httponly'),
                'cookie_samesite' => ini_get('session.cookie_samesite'),
                'use_strict_mode' => ini_get('session.use_strict_mode')
            ]
        ];

        // Check failed login attempts
        $db = Database::getInstance();
        $failedLogins = $db->query("
            SELECT COUNT(*) as count 
            FROM login_attempts 
            WHERE success = 0 
            AND created_at > ?
        ", [date('Y-m-d H:i:s', strtotime('-1 hour'))])->fetch()['count'];

        $checks['failed_logins'] = [
            'status' => $failedLogins > 100 ? 'warning' : 'pass',
            'count' => $failedLogins,
            'period' => '1 hour'
        ];

        return $checks;
    }

    private function getPhpWorkerCount() {
        if (PHP_OS === 'WINNT') {
            exec('tasklist /FI "IMAGENAME eq php-fpm.exe" /NH', $output);
            return count($output);
        } else {
            exec('ps aux | grep php-fpm | grep -v grep | wc -l', $output);
            return (int)$output[0];
        }
    }

    public function getPerformanceReport($days = 7) {
        $auth = $this->requireAdmin();
        if ($auth !== true) return $auth;

        $db = Database::getInstance();
        
        // Get daily stats
        $dailyStats = $db->query("
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_requests,
                AVG(response_time) as avg_response_time,
                MAX(response_time) as max_response_time,
                COUNT(CASE WHEN status_code >= 500 THEN 1 END) as error_count,
                COUNT(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 END) as warning_count
            FROM request_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        ", [$days])->fetchAll();

        // Get endpoint performance
        $endpointStats = $db->query("
            SELECT 
                endpoint,
                COUNT(*) as total_calls,
                AVG(response_time) as avg_response_time,
                MAX(response_time) as max_response_time
            FROM request_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY endpoint
            ORDER BY avg_response_time DESC
            LIMIT 10
        ", [$days])->fetchAll();

        // Get error distribution
        $errorStats = $db->query("
            SELECT 
                status_code,
                COUNT(*) as count
            FROM request_logs
            WHERE 
                created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                AND status_code >= 400
            GROUP BY status_code
            ORDER BY count DESC
        ", [$days])->fetchAll();

        return $this->response([
            'daily_stats' => $dailyStats,
            'slow_endpoints' => $endpointStats,
            'error_distribution' => $errorStats,
            'system_metrics' => $this->getPerformanceMetrics()
        ]);
    }
} 