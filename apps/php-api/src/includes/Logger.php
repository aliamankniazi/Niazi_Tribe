<?php

class Logger {
    private static $logPath;
    private static $instance = null;

    private function __construct() {
        self::$logPath = __DIR__ . '/../logs/';
        if (!file_exists(self::$logPath)) {
            mkdir(self::$logPath, 0755, true);
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function info($message, array $context = []) {
        $this->log('INFO', $message, $context);
    }

    public function error($message, array $context = []) {
        $this->log('ERROR', $message, $context);
    }

    public function warning($message, array $context = []) {
        $this->log('WARNING', $message, $context);
    }

    public function debug($message, array $context = []) {
        $this->log('DEBUG', $message, $context);
    }

    private function log($level, $message, array $context = []) {
        $date = date('Y-m-d H:i:s');
        $logFile = self::$logPath . date('Y-m-d') . '.log';
        
        $contextStr = empty($context) ? '' : ' ' . json_encode($context);
        $userId = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'anonymous';
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $logMessage = sprintf(
            "[%s] [%s] [User:%s] [IP:%s] %s%s\n",
            $date,
            $level,
            $userId,
            $ip,
            $message,
            $contextStr
        );
        
        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }

    public function getRecentLogs($minutes = 60) {
        $logFile = self::$logPath . date('Y-m-d') . '.log';
        if (!file_exists($logFile)) {
            return [];
        }

        $logs = [];
        $cutoffTime = time() - ($minutes * 60);
        
        $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (preg_match('/^\[(.*?)\]/', $line, $matches)) {
                $logTime = strtotime($matches[1]);
                if ($logTime >= $cutoffTime) {
                    $logs[] = $line;
                }
            }
        }
        
        return $logs;
    }

    public function getErrorLogs($limit = 100) {
        $logFile = self::$logPath . date('Y-m-d') . '.log';
        if (!file_exists($logFile)) {
            return [];
        }

        $errors = [];
        $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, '[ERROR]') !== false) {
                $errors[] = $line;
                if (count($errors) >= $limit) {
                    break;
                }
            }
        }
        
        return $errors;
    }

    public function cleanOldLogs($daysToKeep = 30) {
        $files = glob(self::$logPath . '*.log');
        $cutoffTime = time() - ($daysToKeep * 24 * 60 * 60);
        
        foreach ($files as $file) {
            if (filemtime($file) < $cutoffTime) {
                unlink($file);
            }
        }
    }
} 