<?php

class BaseController {
    protected $auth;

    public function __construct() {
        $this->auth = Auth::getInstance();
    }

    protected function requireAuth() {
        if (!$this->auth->isAuthenticated()) {
            http_response_code(401);
            return [
                'status' => 'error',
                'message' => 'Authentication required'
            ];
        }
        return true;
    }

    protected function getRequestData() {
        $data = json_decode(file_get_contents('php://input'), true);
        return is_array($data) ? $data : [];
    }

    protected function validateRequired($data, $fields) {
        $missing = [];
        foreach ($fields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $missing[] = $field;
            }
        }
        
        if (!empty($missing)) {
            return [
                'status' => 'error',
                'message' => 'Missing required fields: ' . implode(', ', $missing)
            ];
        }
        
        return true;
    }

    protected function response($data, $status = 200) {
        http_response_code($status);
        return [
            'status' => $status >= 200 && $status < 300 ? 'success' : 'error',
            'data' => $data
        ];
    }

    protected function error($message, $status = 400) {
        http_response_code($status);
        return [
            'status' => 'error',
            'message' => $message
        ];
    }
} 