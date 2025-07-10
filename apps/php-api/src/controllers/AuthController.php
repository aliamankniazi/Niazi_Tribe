<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../includes/Security.php';

class AuthController extends BaseController {
    private $security;

    public function __construct() {
        parent::__construct();
        $this->security = new Security();
    }

    // ... existing auth methods ...

    public function setup2FA() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        require_once __DIR__ . '/../vendor/autoload.php';
        $ga = new PHPGangsta_GoogleAuthenticator();

        $user = $this->auth->getCurrentUser();
        $secret = $ga->createSecret();
        
        // Store secret temporarily
        $_SESSION['temp_2fa_secret'] = $secret;
        
        // Generate QR code URL
        $qrCodeUrl = $ga->getQRCodeGoogleUrl(
            'Niazi-Tribe:' . $user['email'],
            $secret,
            'Niazi-Tribe'
        );

        return $this->response([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl
        ]);
    }

    public function verify2FA() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['code'])) {
            return $this->error('Verification code is required', 400);
        }

        require_once __DIR__ . '/../vendor/autoload.php';
        $ga = new PHPGangsta_GoogleAuthenticator();

        // Verify code against temporary secret
        $secret = $_SESSION['temp_2fa_secret'] ?? null;
        if (!$secret) {
            return $this->error('2FA setup not initiated', 400);
        }

        if ($ga->verifyCode($secret, $data['code'], 2)) {
            // Store secret permanently
            $db = Database::getInstance();
            $db->query(
                "UPDATE users SET 
                    two_factor_secret = ?,
                    two_factor_enabled = 1
                WHERE id = ?",
                [$secret, $_SESSION['user_id']]
            );

            unset($_SESSION['temp_2fa_secret']);
            return $this->response(['success' => true]);
        }

        return $this->error('Invalid verification code', 400);
    }

    public function disable2FA() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['code'])) {
            return $this->error('Verification code is required', 400);
        }

        $user = $this->auth->getCurrentUser();
        if (!$user['two_factor_enabled']) {
            return $this->error('2FA is not enabled', 400);
        }

        require_once __DIR__ . '/../vendor/autoload.php';
        $ga = new PHPGangsta_GoogleAuthenticator();

        if ($ga->verifyCode($user['two_factor_secret'], $data['code'], 2)) {
            $db = Database::getInstance();
            $db->query(
                "UPDATE users SET 
                    two_factor_secret = NULL,
                    two_factor_enabled = 0
                WHERE id = ?",
                [$_SESSION['user_id']]
            );

            return $this->response(['success' => true]);
        }

        return $this->error('Invalid verification code', 400);
    }

    public function createApiKey() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['name'])) {
            return $this->error('API key name is required', 400);
        }

        // Generate API key and secret
        $apiKey = 'gk_' . bin2hex(random_bytes(16));
        $apiSecret = bin2hex(random_bytes(32));
        $hashedSecret = password_hash($apiSecret, PASSWORD_DEFAULT);

        $db = Database::getInstance();
        try {
            $db->beginTransaction();

            // Store API key
            $db->query(
                "INSERT INTO api_keys (
                    user_id, name, api_key, secret_hash,
                    created_at, last_used_at, status
                ) VALUES (?, ?, ?, ?, NOW(), NULL, 'active')",
                [$_SESSION['user_id'], $data['name'], $apiKey, $hashedSecret]
            );

            // Log creation
            $this->logger->info('API key created', [
                'user_id' => $_SESSION['user_id'],
                'key_name' => $data['name']
            ]);

            $db->commit();

            return $this->response([
                'api_key' => $apiKey,
                'api_secret' => $apiSecret,
                'name' => $data['name']
            ]);

        } catch (Exception $e) {
            $db->rollBack();
            return $this->error('Failed to create API key', 500);
        }
    }

    public function listApiKeys() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $db = Database::getInstance();
        $keys = $db->query(
            "SELECT id, name, api_key, created_at, last_used_at, status
            FROM api_keys
            WHERE user_id = ?
            ORDER BY created_at DESC",
            [$_SESSION['user_id']]
        )->fetchAll();

        return $this->response(['keys' => $keys]);
    }

    public function revokeApiKey() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['key_id'])) {
            return $this->error('API key ID is required', 400);
        }

        $db = Database::getInstance();
        try {
            $db->beginTransaction();

            // Verify ownership
            $key = $db->query(
                "SELECT * FROM api_keys 
                WHERE id = ? AND user_id = ?",
                [$data['key_id'], $_SESSION['user_id']]
            )->fetch();

            if (!$key) {
                return $this->error('API key not found', 404);
            }

            // Revoke key
            $db->query(
                "UPDATE api_keys 
                SET status = 'revoked', 
                    revoked_at = NOW() 
                WHERE id = ?",
                [$data['key_id']]
            );

            // Log revocation
            $this->logger->info('API key revoked', [
                'user_id' => $_SESSION['user_id'],
                'key_name' => $key['name']
            ]);

            $db->commit();
            return $this->response(['success' => true]);

        } catch (Exception $e) {
            $db->rollBack();
            return $this->error('Failed to revoke API key', 500);
        }
    }

    public function validateApiKey($apiKey, $apiSecret) {
        $db = Database::getInstance();
        
        $key = $db->query(
            "SELECT * FROM api_keys 
            WHERE api_key = ? AND status = 'active'",
            [$apiKey]
        )->fetch();

        if (!$key) {
            return false;
        }

        if (!password_verify($apiSecret, $key['secret_hash'])) {
            return false;
        }

        // Update last used timestamp
        $db->query(
            "UPDATE api_keys 
            SET last_used_at = NOW() 
            WHERE id = ?",
            [$key['id']]
        );

        return $key['user_id'];
    }
} 