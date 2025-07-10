<?php

class Security {
    public static function setupHeaders() {
        // CORS headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Max-Age: 86400'); // 24 hours cache

        // Security headers
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Content-Security-Policy: default-src \'self\'');
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit();
        }
    }

    public static function validateToken($token) {
        if (empty($token)) {
            return false;
        }

        // Basic token validation (you might want to enhance this)
        return preg_match('/^[a-f0-9]{64}$/', $token) === 1;
    }

    public static function sanitizeInput($data) {
        if (is_array($data)) {
            return array_map([self::class, 'sanitizeInput'], $data);
        }
        
        if (is_string($data)) {
            // Remove any null bytes
            $data = str_replace(chr(0), '', $data);
            
            // Remove any non-printable characters
            $data = preg_replace('/[^\P{C}\n\r\t]+/u', '', $data);
            
            // Convert special characters to HTML entities
            return htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
        }
        
        return $data;
    }

    public static function validateDate($date) {
        if (empty($date)) {
            return true;
        }

        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }

    public static function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function validatePassword($password) {
        // At least 8 characters
        // At least one uppercase letter
        // At least one lowercase letter
        // At least one number
        // At least one special character
        return strlen($password) >= 8 &&
            preg_match('/[A-Z]/', $password) &&
            preg_match('/[a-z]/', $password) &&
            preg_match('/[0-9]/', $password) &&
            preg_match('/[^A-Za-z0-9]/', $password);
    }

    public static function generateRandomToken($length = 32) {
        return bin2hex(random_bytes($length));
    }

    public static function rateLimit($key, $maxRequests = 60, $perSeconds = 60) {
        $redis = new Redis();
        try {
            $redis->connect('127.0.0.1', 6379);
            
            $current = $redis->get($key);
            if (!$current) {
                $redis->setex($key, $perSeconds, 1);
                return true;
            }
            
            if ($current >= $maxRequests) {
                return false;
            }
            
            $redis->incr($key);
            return true;
        } catch (Exception $e) {
            // If Redis is not available, fallback to allow request
            return true;
        }
    }
} 