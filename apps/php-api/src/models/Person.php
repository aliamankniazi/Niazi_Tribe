<?php

require_once __DIR__ . '/BaseModel.php';

class Person extends BaseModel {
    protected $table = 'persons';
    protected $fillable = [
        'tree_id',
        'first_name',
        'last_name',
        'gender',
        'birth_date',
        'birth_place',
        'death_date',
        'death_place'
    ];

    public function create(array $data) {
        // Sanitize input
        $data['first_name'] = $this->sanitize($data['first_name']);
        $data['last_name'] = $this->sanitize($data['last_name']);
        $data['birth_place'] = $this->sanitize($data['birth_place'] ?? null);
        $data['death_place'] = $this->sanitize($data['death_place'] ?? null);

        // Validate gender
        if (!in_array($data['gender'], ['male', 'female', 'other'])) {
            throw new Exception('Invalid gender value');
        }

        // Validate dates
        foreach (['birth_date', 'death_date'] as $date) {
            if (isset($data[$date])) {
                if (!strtotime($data[$date])) {
                    throw new Exception("Invalid {$date} format");
                }
                $data[$date] = date('Y-m-d', strtotime($data[$date]));
            }
        }

        return parent::create($data);
    }

    public function getRelationships($personId, $type = null) {
        $sql = "SELECT r.*, p.* FROM relationships r
                JOIN persons p ON (r.person1_id = ? AND r.person2_id = p.id)
                    OR (r.person2_id = ? AND r.person1_id = p.id)";
        $params = [$personId, $personId];

        if ($type) {
            $sql .= " WHERE r.relationship_type = ?";
            $params[] = $type;
        }

        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function addRelationship($person1Id, $person2Id, $type, $treeId) {
        if (!in_array($type, ['parent', 'spouse', 'sibling'])) {
            throw new Exception('Invalid relationship type');
        }

        // Verify both persons belong to the same tree
        $stmt = $this->db->query(
            "SELECT COUNT(*) as count FROM persons 
            WHERE id IN (?, ?) AND tree_id = ?",
            [$person1Id, $person2Id, $treeId]
        );
        $result = $stmt->fetch();

        if ($result['count'] !== 2) {
            throw new Exception('Both persons must belong to the same tree');
        }

        return $this->db->query(
            "INSERT INTO relationships (tree_id, person1_id, person2_id, relationship_type)
            VALUES (?, ?, ?, ?)",
            [$treeId, $person1Id, $person2Id, $type]
        )->rowCount();
    }

    public function removeRelationship($person1Id, $person2Id, $type = null) {
        $sql = "DELETE FROM relationships WHERE 
                (person1_id = ? AND person2_id = ?) OR
                (person1_id = ? AND person2_id = ?)";
        $params = [$person1Id, $person2Id, $person2Id, $person1Id];

        if ($type) {
            $sql .= " AND relationship_type = ?";
            $params[] = $type;
        }

        return $this->db->query($sql, $params)->rowCount();
    }

    public function search($treeId, $query) {
        $query = "%{$this->sanitize($query)}%";
        
        $stmt = $this->db->query(
            "SELECT * FROM persons 
            WHERE tree_id = ? AND (
                first_name LIKE ? OR
                last_name LIKE ? OR
                CONCAT(first_name, ' ', last_name) LIKE ?
            )",
            [$treeId, $query, $query, $query]
        );
        
        return $stmt->fetchAll();
    }
} 