<?php

class RequestLogger {
    private $startTime;
    private $db;
    private $logger;

    public function __construct() {
        $this->startTime = microtime(true);
        $this->db = Database::getInstance();
        $this->logger = Logger::getInstance();
    }

    public function handle() {
        // Start output buffering to capture response
        ob_start();
        
        // Store request data
        $requestData = [
            'method' => $_SERVER['REQUEST_METHOD'],
            'endpoint' => parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH),
            'query_string' => $_SERVER['QUERY_STRING'] ?? '',
            'ip_address' => $_SERVER['REMOTE_ADDR'],
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
            'referer' => $_SERVER['HTTP_REFERER'] ?? '',
            'user_id' => $_SESSION['user_id'] ?? null,
            'request_id' => uniqid('req_', true),
            'started_at' => date('Y-m-d H:i:s'),
        ];

        // Add request ID to response headers for debugging
        header('X-Request-ID: ' . $requestData['request_id']);

        // Register shutdown function to log after response
        register_shutdown_function(function() use ($requestData) {
            $endTime = microtime(true);
            $duration = ($endTime - $this->startTime) * 1000; // Convert to milliseconds
            
            // Get response data
            $response = ob_get_contents();
            $statusCode = http_response_code();
            
            // Log request
            try {
                $this->db->query(
                    "INSERT INTO request_logs (
                        request_id, method, endpoint, query_string,
                        ip_address, user_agent, referer, user_id,
                        status_code, response_time, response_size,
                        created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $requestData['request_id'],
                        $requestData['method'],
                        $requestData['endpoint'],
                        $requestData['query_string'],
                        $requestData['ip_address'],
                        $requestData['user_agent'],
                        $requestData['referer'],
                        $requestData['user_id'],
                        $statusCode,
                        $duration,
                        strlen($response),
                        $requestData['started_at']
                    ]
                );

                // Log slow requests
                if ($duration > 1000) { // More than 1 second
                    $this->logger->warning('Slow request detected', [
                        'request_id' => $requestData['request_id'],
                        'duration' => $duration,
                        'endpoint' => $requestData['endpoint']
                    ]);
                }

                // Log errors
                if ($statusCode >= 500) {
                    $this->logger->error('Server error occurred', [
                        'request_id' => $requestData['request_id'],
                        'status_code' => $statusCode,
                        'endpoint' => $requestData['endpoint']
                    ]);
                }

                // Track rate limits
                if ($statusCode === 429) {
                    $this->logger->warning('Rate limit exceeded', [
                        'request_id' => $requestData['request_id'],
                        'ip_address' => $requestData['ip_address'],
                        'endpoint' => $requestData['endpoint']
                    ]);
                }

            } catch (Exception $e) {
                $this->logger->error('Failed to log request', [
                    'error' => $e->getMessage(),
                    'request_id' => $requestData['request_id']
                ]);
            }
        });

        return true;
    }
} 