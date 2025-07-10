<?php

require_once __DIR__ . '/BaseModel.php';

class User extends BaseModel {
    protected $table = 'users';
    protected $fillable = ['name', 'email', 'password'];

    public function create(array $data) {
        // Sanitize and validate input
        $data['name'] = $this->sanitize($data['name']);
        $data['email'] = filter_var($this->sanitize($data['email']), FILTER_VALIDATE_EMAIL);
        
        if (!$data['email']) {
            throw new Exception('Invalid email address');
        }

        // Hash password
        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

        return parent::create($data);
    }

    public function findByEmail($email) {
        $stmt = $this->db->query(
            "SELECT * FROM {$this->table} WHERE email = ? LIMIT 1",
            [$email]
        );
        return $stmt->fetch();
    }

    public function getOwnedTrees($userId) {
        $stmt = $this->db->query(
            "SELECT * FROM family_trees WHERE owner_id = ?",
            [$userId]
        );
        return $stmt->fetchAll();
    }

    public function getAccessibleTrees($userId) {
        $stmt = $this->db->query(
            "SELECT ft.* FROM family_trees ft
            LEFT JOIN tree_access ta ON ft.id = ta.tree_id
            WHERE ft.owner_id = ? OR (ta.user_id = ? AND ta.access_level IN ('view', 'edit', 'admin'))",
            [$userId, $userId]
        );
        return $stmt->fetchAll();
    }
} 