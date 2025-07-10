<?php

require_once __DIR__ . '/BaseModel.php';

class FamilyTree extends BaseModel {
    protected $table = 'family_trees';
    protected $fillable = ['name', 'description', 'owner_id', 'privacy_level'];

    public function create(array $data) {
        $data['name'] = $this->sanitize($data['name']);
        $data['description'] = $this->sanitize($data['description'] ?? '');
        
        if (!in_array($data['privacy_level'], ['public', 'private', 'shared'])) {
            $data['privacy_level'] = 'private';
        }

        return parent::create($data);
    }

    public function getMembers($treeId) {
        $stmt = $this->db->query(
            "SELECT p.* FROM persons p WHERE p.tree_id = ?",
            [$treeId]
        );
        return $stmt->fetchAll();
    }

    public function addAccess($treeId, $userId, $accessLevel) {
        if (!in_array($accessLevel, ['view', 'edit', 'admin'])) {
            throw new Exception('Invalid access level');
        }

        return $this->db->query(
            "INSERT INTO tree_access (tree_id, user_id, access_level) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE access_level = ?",
            [$treeId, $userId, $accessLevel, $accessLevel]
        )->rowCount();
    }

    public function removeAccess($treeId, $userId) {
        return $this->db->query(
            "DELETE FROM tree_access WHERE tree_id = ? AND user_id = ?",
            [$treeId, $userId]
        )->rowCount();
    }

    public function checkAccess($treeId, $userId) {
        // First check if user is owner
        $tree = $this->find($treeId);
        if ($tree && $tree['owner_id'] === $userId) {
            return 'owner';
        }

        // Then check tree_access table
        $stmt = $this->db->query(
            "SELECT access_level FROM tree_access WHERE tree_id = ? AND user_id = ?",
            [$treeId, $userId]
        );
        $access = $stmt->fetch();
        
        return $access ? $access['access_level'] : null;
    }

    public function getSharedUsers($treeId) {
        $stmt = $this->db->query(
            "SELECT u.id, u.name, u.email, ta.access_level
            FROM users u
            JOIN tree_access ta ON u.id = ta.user_id
            WHERE ta.tree_id = ?",
            [$treeId]
        );
        return $stmt->fetchAll();
    }
} 