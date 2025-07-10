<?php

abstract class BaseModel {
    protected $db;
    protected $table;
    protected $fillable = [];

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function find($id) {
        $stmt = $this->db->query(
            "SELECT * FROM {$this->table} WHERE id = ? LIMIT 1",
            [$id]
        );
        return $stmt->fetch();
    }

    public function create(array $data) {
        $filtered = array_intersect_key($data, array_flip($this->fillable));
        if (empty($filtered)) {
            return false;
        }

        $fields = array_keys($filtered);
        $values = array_values($filtered);
        $placeholders = str_repeat('?,', count($fields) - 1) . '?';

        $sql = sprintf(
            "INSERT INTO %s (%s) VALUES (%s)",
            $this->table,
            implode(', ', $fields),
            $placeholders
        );

        $this->db->query($sql, $values);
        return $this->db->getConnection()->lastInsertId();
    }

    public function update($id, array $data) {
        $filtered = array_intersect_key($data, array_flip($this->fillable));
        if (empty($filtered)) {
            return false;
        }

        $fields = array_map(function($field) {
            return "$field = ?";
        }, array_keys($filtered));

        $sql = sprintf(
            "UPDATE %s SET %s WHERE id = ?",
            $this->table,
            implode(', ', $fields)
        );

        $values = array_values($filtered);
        $values[] = $id;

        return $this->db->query($sql, $values)->rowCount();
    }

    public function delete($id) {
        return $this->db->query(
            "DELETE FROM {$this->table} WHERE id = ?",
            [$id]
        )->rowCount();
    }

    protected function sanitize($value) {
        if (is_string($value)) {
            return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
        }
        return $value;
    }
} 