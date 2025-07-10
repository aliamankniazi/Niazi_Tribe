<?php

class Auth {
    private static $instance = null;
    private $db;

    private function __construct() {
        $this->db = Database::getInstance();
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function login($email, $password) {
        $stmt = $this->db->query(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            [$email]
        );
        
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            // Create session/token
            $token = bin2hex(random_bytes(32));
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['token'] = $token;
            
            return [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'token' => $token
            ];
        }
        
        return false;
    }

    public function register($name, $email, $password) {
        // Check if user exists
        $stmt = $this->db->query(
            "SELECT id FROM users WHERE email = ?",
            [$email]
        );
        
        if ($stmt->fetch()) {
            return false; // User already exists
        }

        // Create new user
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $this->db->query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [$name, $email, $hashedPassword]
        );
        
        return $this->db->getConnection()->lastInsertId();
    }

    public function isAuthenticated() {
        return isset($_SESSION['user_id']) && isset($_SESSION['token']);
    }

    public function getCurrentUser() {
        if (!$this->isAuthenticated()) {
            return null;
        }

        $stmt = $this->db->query(
            "SELECT id, name, email FROM users WHERE id = ?",
            [$_SESSION['user_id']]
        );
        
        return $stmt->fetch();
    }

    public function logout() {
        session_destroy();
    }
} 