<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Logger.php';

class MonitoringService {
    private $db;
    private $logger;
    private $config;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->logger = new Logger();
        $this->config = require __DIR__ . '/../config/monitoring.php';
    }

    public function checkSystemHealth() {
        $checks = [
            'database' => $this->checkDatabaseHealth(),
            'redis' => $this->checkRedisHealth(),
            'disk_space' => $this->checkDiskSpace(),
            'memory' => $this->checkMemoryUsage(),
            'php_workers' => $this->checkPhpWorkers(),
            'log_files' => $this->checkLogFiles(),
            'queue_status' => $this->checkQueueStatus(),
            'ssl_certificates' => $this->checkSslCertificates()
        ];

        $overallStatus = 'healthy';
        $alerts = [];

        foreach ($checks as $component => $status) {
            if ($status['status'] === 'error') {
                $overallStatus = 'error';
                $alerts[] = [
                    'component' => $component,
                    'message' => $status['message'],
                    'severity' => 'high'
                ];
            } elseif ($status['status'] === 'warning') {
                if ($overallStatus !== 'error') {
                    $overallStatus = 'warning';
                }
                $alerts[] = [
                    'component' => $component,
                    'message' => $status['message'],
                    'severity' => 'medium'
                ];
            }
        }

        if (!empty($alerts)) {
            $this->sendAlerts($alerts);
        }

        return [
            'timestamp' => date('Y-m-d H:i:s'),
            'overall_status' => $overallStatus,
            'checks' => $checks,
            'alerts' => $alerts
        ];
    }

    private function checkDatabaseHealth() {
        try {
            $start = microtime(true);
            $this->db->query("SELECT 1")->fetch();
            $latency = (microtime(true) - $start) * 1000;

            if ($latency > $this->config['database']['critical_latency']) {
                return [
                    'status' => 'error',
                    'message' => "Database latency critical: {$latency}ms",
                    'latency' => $latency
                ];
            } elseif ($latency > $this->config['database']['warning_latency']) {
                return [
                    'status' => 'warning',
                    'message' => "Database latency high: {$latency}ms",
                    'latency' => $latency
                ];
            }

            return [
                'status' => 'healthy',
                'message' => 'Database connection successful',
                'latency' => $latency
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Database connection failed: ' . $e->getMessage()
            ];
        }
    }

    private function checkRedisHealth() {
        try {
            $redis = new Redis();
            $redis->connect(
                $this->config['redis']['host'],
                $this->config['redis']['port']
            );

            $start = microtime(true);
            $redis->ping();
            $latency = (microtime(true) - $start) * 1000;

            if ($latency > $this->config['redis']['critical_latency']) {
                return [
                    'status' => 'error',
                    'message' => "Redis latency critical: {$latency}ms",
                    'latency' => $latency
                ];
            }

            return [
                'status' => 'healthy',
                'message' => 'Redis connection successful',
                'latency' => $latency
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Redis connection failed: ' . $e->getMessage()
            ];
        }
    }

    private function checkDiskSpace() {
        $totalSpace = disk_total_space('/');
        $freeSpace = disk_free_space('/');
        $usedPercent = 100 - ($freeSpace / $totalSpace * 100);

        if ($usedPercent > $this->config['disk']['critical_threshold']) {
            return [
                'status' => 'error',
                'message' => "Disk usage critical: {$usedPercent}%",
                'used_percent' => $usedPercent
            ];
        } elseif ($usedPercent > $this->config['disk']['warning_threshold']) {
            return [
                'status' => 'warning',
                'message' => "Disk usage high: {$usedPercent}%",
                'used_percent' => $usedPercent
            ];
        }

        return [
            'status' => 'healthy',
            'message' => 'Disk space within normal range',
            'used_percent' => $usedPercent
        ];
    }

    private function checkMemoryUsage() {
        $memInfo = file_get_contents('/proc/meminfo');
        preg_match_all('/^(\w+):\s+(\d+)/m', $memInfo, $matches);
        $mem = array_combine($matches[1], $matches[2]);

        $totalMem = $mem['MemTotal'];
        $freeMem = $mem['MemFree'] + $mem['Buffers'] + $mem['Cached'];
        $usedPercent = 100 - ($freeMem / $totalMem * 100);

        if ($usedPercent > $this->config['memory']['critical_threshold']) {
            return [
                'status' => 'error',
                'message' => "Memory usage critical: {$usedPercent}%",
                'used_percent' => $usedPercent
            ];
        } elseif ($usedPercent > $this->config['memory']['warning_threshold']) {
            return [
                'status' => 'warning',
                'message' => "Memory usage high: {$usedPercent}%",
                'used_percent' => $usedPercent
            ];
        }

        return [
            'status' => 'healthy',
            'message' => 'Memory usage within normal range',
            'used_percent' => $usedPercent
        ];
    }

    private function checkPhpWorkers() {
        exec('ps aux | grep php-fpm | wc -l', $output);
        $workerCount = intval($output[0]) - 2; // Subtract grep process and count line

        if ($workerCount < $this->config['php_fpm']['min_workers']) {
            return [
                'status' => 'error',
                'message' => "PHP-FPM worker count too low: {$workerCount}",
                'worker_count' => $workerCount
            ];
        } elseif ($workerCount > $this->config['php_fpm']['max_workers']) {
            return [
                'status' => 'warning',
                'message' => "PHP-FPM worker count high: {$workerCount}",
                'worker_count' => $workerCount
            ];
        }

        return [
            'status' => 'healthy',
            'message' => 'PHP-FPM worker count within normal range',
            'worker_count' => $workerCount
        ];
    }

    private function checkLogFiles() {
        $logDir = __DIR__ . '/../logs';
        $totalSize = 0;
        $oldLogs = [];

        foreach (glob($logDir . '/*.log') as $file) {
            $size = filesize($file);
            $totalSize += $size;
            
            $age = time() - filemtime($file);
            if ($age > $this->config['logs']['max_age']) {
                $oldLogs[] = basename($file);
            }
        }

        $status = [
            'status' => 'healthy',
            'message' => 'Log files within normal range',
            'total_size' => $totalSize,
            'old_logs' => $oldLogs
        ];

        if ($totalSize > $this->config['logs']['critical_size']) {
            $status['status'] = 'error';
            $status['message'] = 'Log files total size critical';
        } elseif ($totalSize > $this->config['logs']['warning_size']) {
            $status['status'] = 'warning';
            $status['message'] = 'Log files total size high';
        }

        if (!empty($oldLogs)) {
            if ($status['status'] === 'healthy') {
                $status['status'] = 'warning';
            }
            $status['message'] .= '. Old log files found';
        }

        return $status;
    }

    private function checkQueueStatus() {
        try {
            $queueStats = $this->db->query(
                "SELECT status, COUNT(*) as count 
                FROM jobs 
                GROUP BY status"
            )->fetchAll(PDO::FETCH_KEY_PAIR);

            $failedCount = $queueStats['failed'] ?? 0;
            $pendingCount = $queueStats['pending'] ?? 0;

            if ($failedCount > $this->config['queue']['max_failed']) {
                return [
                    'status' => 'error',
                    'message' => "High number of failed jobs: {$failedCount}",
                    'stats' => $queueStats
                ];
            } elseif ($pendingCount > $this->config['queue']['max_pending']) {
                return [
                    'status' => 'warning',
                    'message' => "High number of pending jobs: {$pendingCount}",
                    'stats' => $queueStats
                ];
            }

            return [
                'status' => 'healthy',
                'message' => 'Queue status normal',
                'stats' => $queueStats
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to check queue status: ' . $e->getMessage()
            ];
        }
    }

    private function checkSslCertificates() {
        $domain = $_SERVER['HTTP_HOST'];
        $context = stream_context_create([
            'ssl' => [
                'capture_peer_cert' => true,
                'verify_peer' => false
            ]
        ]);

        try {
            $client = stream_socket_client(
                "ssl://{$domain}:443",
                $errno,
                $errstr,
                30,
                STREAM_CLIENT_CONNECT,
                $context
            );

            $params = stream_context_get_params($client);
            $cert = openssl_x509_parse($params['options']['ssl']['peer_certificate']);

            $expiryDate = $cert['validTo_time_t'];
            $daysUntilExpiry = ceil(($expiryDate - time()) / 86400);

            if ($daysUntilExpiry <= $this->config['ssl']['critical_days']) {
                return [
                    'status' => 'error',
                    'message' => "SSL certificate expires in {$daysUntilExpiry} days",
                    'expiry_date' => date('Y-m-d', $expiryDate),
                    'days_until_expiry' => $daysUntilExpiry
                ];
            } elseif ($daysUntilExpiry <= $this->config['ssl']['warning_days']) {
                return [
                    'status' => 'warning',
                    'message' => "SSL certificate expires in {$daysUntilExpiry} days",
                    'expiry_date' => date('Y-m-d', $expiryDate),
                    'days_until_expiry' => $daysUntilExpiry
                ];
            }

            return [
                'status' => 'healthy',
                'message' => 'SSL certificate valid',
                'expiry_date' => date('Y-m-d', $expiryDate),
                'days_until_expiry' => $daysUntilExpiry
            ];
        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Failed to check SSL certificate: ' . $e->getMessage()
            ];
        }
    }

    private function sendAlerts($alerts) {
        foreach ($alerts as $alert) {
            // Log alert
            $this->logger->error('System alert', [
                'component' => $alert['component'],
                'message' => $alert['message'],
                'severity' => $alert['severity']
            ]);

            // Store in database
            $this->db->query(
                "INSERT INTO system_alerts (
                    component, message, severity, created_at
                ) VALUES (?, ?, ?, NOW())",
                [
                    $alert['component'],
                    $alert['message'],
                    $alert['severity']
                ]
            );

            // Send email notification for high severity alerts
            if ($alert['severity'] === 'high') {
                $this->sendEmailAlert($alert);
            }

            // Send Slack notification
            if ($this->config['notifications']['slack_webhook']) {
                $this->sendSlackAlert($alert);
            }
        }
    }

    private function sendEmailAlert($alert) {
        $adminEmails = $this->config['notifications']['admin_emails'];
        $subject = "System Alert: {$alert['component']}";
        $message = "Alert Details:\n" .
                  "Component: {$alert['component']}\n" .
                  "Message: {$alert['message']}\n" .
                  "Severity: {$alert['severity']}\n" .
                  "Time: " . date('Y-m-d H:i:s');

        foreach ($adminEmails as $email) {
            mail($email, $subject, $message);
        }
    }

    private function sendSlackAlert($alert) {
        $webhook = $this->config['notifications']['slack_webhook'];
        $color = $alert['severity'] === 'high' ? '#ff0000' : '#ffa500';

        $payload = json_encode([
            'attachments' => [
                [
                    'color' => $color,
                    'title' => "System Alert: {$alert['component']}",
                    'text' => $alert['message'],
                    'fields' => [
                        [
                            'title' => 'Severity',
                            'value' => $alert['severity'],
                            'short' => true
                        ],
                        [
                            'title' => 'Time',
                            'value' => date('Y-m-d H:i:s'),
                            'short' => true
                        ]
                    ]
                ]
            ]
        ]);

        $ch = curl_init($webhook);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Content-Length: ' . strlen($payload)
        ]);

        curl_exec($ch);
        curl_close($ch);
    }
} 