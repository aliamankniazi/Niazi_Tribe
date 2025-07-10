<?php

require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../models/FamilyTree.php';
require_once __DIR__ . '/../models/Person.php';
require_once __DIR__ . '/../includes/Security.php';

class FamilyTreeController extends BaseController {
    private $treeModel;
    private $personModel;
    private $security;

    public function __construct() {
        parent::__construct();
        $this->treeModel = new FamilyTree();
        $this->personModel = new Person();
        $this->security = new Security();
    }

    public function create() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = $this->getRequestData();
        $validation = $this->validateRequired($data, ['name']);
        if ($validation !== true) return $validation;

        $data['owner_id'] = $this->auth->getCurrentUser()['id'];
        
        try {
            $treeId = $this->treeModel->create($data);
            return $this->response(['id' => $treeId]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function get($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $tree = $this->treeModel->find($treeId);
        if (!$tree) {
            return $this->error('Tree not found', 404);
        }

        $access = $this->treeModel->checkAccess($treeId, $this->auth->getCurrentUser()['id']);
        if (!$access && $tree['privacy_level'] !== 'public') {
            return $this->error('Access denied', 403);
        }

        $tree['members'] = $this->treeModel->getMembers($treeId);
        return $this->response($tree);
    }

    public function update($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $tree = $this->treeModel->find($treeId);
        if (!$tree) {
            return $this->error('Tree not found', 404);
        }

        $access = $this->treeModel->checkAccess($treeId, $this->auth->getCurrentUser()['id']);
        if ($access !== 'owner' && $access !== 'admin') {
            return $this->error('Access denied', 403);
        }

        $data = $this->getRequestData();
        try {
            $this->treeModel->update($treeId, $data);
            return $this->response(['id' => $treeId]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function delete($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $tree = $this->treeModel->find($treeId);
        if (!$tree) {
            return $this->error('Tree not found', 404);
        }

        $access = $this->treeModel->checkAccess($treeId, $this->auth->getCurrentUser()['id']);
        if ($access !== 'owner') {
            return $this->error('Access denied', 403);
        }

        try {
            $this->treeModel->delete($treeId);
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function share() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = $this->getRequestData();
        $validation = $this->validateRequired($data, ['tree_id', 'user_id', 'access_level']);
        if ($validation !== true) return $validation;

        $tree = $this->treeModel->find($data['tree_id']);
        if (!$tree) {
            return $this->error('Tree not found', 404);
        }

        $access = $this->treeModel->checkAccess($data['tree_id'], $this->auth->getCurrentUser()['id']);
        if ($access !== 'owner' && $access !== 'admin') {
            return $this->error('Access denied', 403);
        }

        try {
            $this->treeModel->addAccess($data['tree_id'], $data['user_id'], $data['access_level']);
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function removeAccess() {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $data = $this->getRequestData();
        $validation = $this->validateRequired($data, ['tree_id', 'user_id']);
        if ($validation !== true) return $validation;

        $tree = $this->treeModel->find($data['tree_id']);
        if (!$tree) {
            return $this->error('Tree not found', 404);
        }

        $access = $this->treeModel->checkAccess($data['tree_id'], $this->auth->getCurrentUser()['id']);
        if ($access !== 'owner' && $access !== 'admin') {
            return $this->error('Access denied', 403);
        }

        try {
            $this->treeModel->removeAccess($data['tree_id'], $data['user_id']);
            return $this->response(['success' => true]);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function listShared($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        $tree = $this->treeModel->find($treeId);
        if (!$tree) {
            return $this->error('Tree not found', 404);
        }

        $access = $this->treeModel->checkAccess($treeId, $this->auth->getCurrentUser()['id']);
        if ($access !== 'owner' && $access !== 'admin') {
            return $this->error('Access denied', 403);
        }

        try {
            $users = $this->treeModel->getSharedUsers($treeId);
            return $this->response($users);
        } catch (Exception $e) {
            return $this->error($e->getMessage());
        }
    }

    public function getTreeStatistics($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        if (!$this->treeModel->hasAccess($treeId, $_SESSION['user_id'])) {
            return $this->error('Access denied', 403);
        }

        $db = Database::getInstance();
        
        // Get basic counts
        $personCount = $db->query(
            "SELECT COUNT(*) as count FROM persons WHERE tree_id = ?",
            [$treeId]
        )->fetch()['count'];

        $relationshipCount = $db->query(
            "SELECT COUNT(*) as count FROM relationships WHERE tree_id = ?",
            [$treeId]
        )->fetch()['count'];

        // Get generation count
        $generations = $db->query(
            "WITH RECURSIVE generation_cte AS (
                SELECT id, 0 as generation
                FROM persons
                WHERE tree_id = ? AND parent1_id IS NULL AND parent2_id IS NULL
                
                UNION ALL
                
                SELECT p.id, g.generation + 1
                FROM persons p
                JOIN generation_cte g ON p.parent1_id = g.id OR p.parent2_id = g.id
                WHERE p.tree_id = ?
            )
            SELECT MAX(generation) as max_gen
            FROM generation_cte",
            [$treeId, $treeId]
        )->fetch();

        // Get age distribution
        $ageDistribution = $db->query(
            "SELECT 
                CASE 
                    WHEN birth_year IS NULL THEN 'unknown'
                    WHEN birth_year <= YEAR(CURDATE()) - 80 THEN '80+'
                    WHEN birth_year <= YEAR(CURDATE()) - 60 THEN '60-79'
                    WHEN birth_year <= YEAR(CURDATE()) - 40 THEN '40-59'
                    WHEN birth_year <= YEAR(CURDATE()) - 20 THEN '20-39'
                    ELSE '0-19'
                END as age_group,
                COUNT(*) as count
            FROM persons
            WHERE tree_id = ?
            GROUP BY age_group",
            [$treeId]
        )->fetchAll();

        // Get surname distribution
        $surnames = $db->query(
            "SELECT last_name, COUNT(*) as count
            FROM persons
            WHERE tree_id = ? AND last_name IS NOT NULL
            GROUP BY last_name
            ORDER BY count DESC
            LIMIT 10",
            [$treeId]
        )->fetchAll();

        return $this->response([
            'total_persons' => $personCount,
            'total_relationships' => $relationshipCount,
            'generations' => $generations['max_gen'] + 1,
            'age_distribution' => $ageDistribution,
            'top_surnames' => $surnames
        ]);
    }

    public function exportTreeData($treeId, $format = 'json') {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        if (!$this->treeModel->hasAccess($treeId, $_SESSION['user_id'])) {
            return $this->error('Access denied', 403);
        }

        // Rate limit exports
        if (!Security::rateLimit('export_' . $_SESSION['user_id'], 10, 3600)) {
            return $this->error('Export rate limit exceeded. Try again later.', 429);
        }

        $db = Database::getInstance();
        
        // Get all persons in the tree
        $persons = $db->query(
            "SELECT * FROM persons WHERE tree_id = ?",
            [$treeId]
        )->fetchAll();

        // Get all relationships
        $relationships = $db->query(
            "SELECT * FROM relationships WHERE tree_id = ?",
            [$treeId]
        )->fetchAll();

        $data = [
            'tree_info' => $db->query(
                "SELECT * FROM family_trees WHERE id = ?",
                [$treeId]
            )->fetch(),
            'persons' => $persons,
            'relationships' => $relationships
        ];

        switch ($format) {
            case 'json':
                header('Content-Type: application/json');
                header('Content-Disposition: attachment; filename="tree_' . $treeId . '.json"');
                echo json_encode($data, JSON_PRETTY_PRINT);
                break;

            case 'xml':
                header('Content-Type: application/xml');
                header('Content-Disposition: attachment; filename="tree_' . $treeId . '.xml"');
                echo $this->convertToXml($data);
                break;

            case 'csv':
                header('Content-Type: text/csv');
                header('Content-Disposition: attachment; filename="tree_' . $treeId . '.csv"');
                $this->exportToCsv($data);
                break;

            case 'gedcom':
                header('Content-Type: text/plain');
                header('Content-Disposition: attachment; filename="tree_' . $treeId . '.ged"');
                echo $this->convertToGedcom($data);
                break;

            case 'pdf':
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="tree_' . $treeId . '.pdf"');
                echo $this->exportToPdf($data);
                break;

            case 'excel':
                header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                header('Content-Disposition: attachment; filename="tree_' . $treeId . '.xlsx"');
                echo $this->exportToExcel($data);
                break;

            default:
                return $this->error('Unsupported format', 400);
        }
        exit;
    }

    private function convertToXml($data) {
        $xml = new SimpleXMLElement('<?xml version="1.0" encoding="UTF-8"?><familyTree></familyTree>');
        
        // Add tree info
        $treeInfo = $xml->addChild('treeInfo');
        foreach ($data['tree_info'] as $key => $value) {
            if ($value !== null) {
                $treeInfo->addChild($key, htmlspecialchars($value));
            }
        }
        
        // Add persons
        $persons = $xml->addChild('persons');
        foreach ($data['persons'] as $person) {
            $personNode = $persons->addChild('person');
            foreach ($person as $key => $value) {
                if ($value !== null) {
                    $personNode->addChild($key, htmlspecialchars($value));
                }
            }
        }
        
        // Add relationships
        $relationships = $xml->addChild('relationships');
        foreach ($data['relationships'] as $rel) {
            $relNode = $relationships->addChild('relationship');
            foreach ($rel as $key => $value) {
                if ($value !== null) {
                    $relNode->addChild($key, htmlspecialchars($value));
                }
            }
        }
        
        return $xml->asXML();
    }

    private function exportToCsv($data) {
        // Export persons
        $personsFp = fopen('php://output', 'w');
        fputcsv($personsFp, ['ID', 'First Name', 'Last Name', 'Gender', 'Birth Date', 'Death Date', 'Parent1 ID', 'Parent2 ID']);
        
        foreach ($data['persons'] as $person) {
            fputcsv($personsFp, [
                $person['id'],
                $person['first_name'],
                $person['last_name'],
                $person['gender'],
                $person['birth_date'],
                $person['death_date'],
                $person['parent1_id'],
                $person['parent2_id']
            ]);
        }
        
        fwrite($personsFp, "\n\nRelationships:\n");
        fputcsv($personsFp, ['ID', 'Person1 ID', 'Person2 ID', 'Type', 'Marriage Date']);
        
        foreach ($data['relationships'] as $rel) {
            fputcsv($personsFp, [
                $rel['id'],
                $rel['person1_id'],
                $rel['person2_id'],
                $rel['type'],
                $rel['marriage_date'] ?? ''
            ]);
        }
        
        fclose($personsFp);
    }

    private function convertToGedcom($data) {
        $output = "0 HEAD\n";
        $output .= "1 CHAR UTF-8\n";
        $output .= "1 GEDC\n";
        $output .= "2 VERS 5.5.1\n";
        $output .= "2 FORM LINEAGE-LINKED\n";
        $output .= "1 SOUR NIAZI_TRIBE\n";
        $output .= "1 DATE " . date('d M Y') . "\n";
        
        foreach ($data['persons'] as $person) {
            $output .= "\n0 @I" . $person['id'] . "@ INDI\n";
            $output .= "1 NAME " . $person['first_name'] . " /" . $person['last_name'] . "/\n";
            
            if ($person['birth_date']) {
                $output .= "1 BIRT\n";
                $output .= "2 DATE " . $person['birth_date'] . "\n";
            }
            
            if ($person['death_date']) {
                $output .= "1 DEAT\n";
                $output .= "2 DATE " . $person['death_date'] . "\n";
            }
            
            if ($person['gender']) {
                $output .= "1 SEX " . substr($person['gender'], 0, 1) . "\n";
            }
        }

        foreach ($data['relationships'] as $rel) {
            if ($rel['type'] === 'marriage') {
                $output .= "\n0 @F" . $rel['id'] . "@ FAM\n";
                $output .= "1 HUSB @I" . $rel['person1_id'] . "@\n";
                $output .= "1 WIFE @I" . $rel['person2_id'] . "@\n";
                
                if ($rel['marriage_date']) {
                    $output .= "1 MARR\n";
                    $output .= "2 DATE " . $rel['marriage_date'] . "\n";
                }
            }
        }

        $output .= "\n0 TRLR\n";
        return $output;
    }

    private function exportToPdf($data) {
        require_once __DIR__ . '/../vendor/autoload.php';

        // Initialize TCPDF
        $pdf = new TCPDF(PDF_PAGE_ORIENTATION, PDF_UNIT, PDF_PAGE_FORMAT, true, 'UTF-8', false);
        
        // Set document information
        $pdf->SetCreator('Niazi-Tribe');
        $pdf->SetAuthor('Niazi-Tribe');
        $pdf->SetTitle('Family Tree ' . $data['tree_info']['name']);
        
        // Set header and footer
        $pdf->setPrintHeader(false);
        $pdf->setPrintFooter(true);
        $pdf->setFooterData(array(0,64,0), array(0,64,128));
        
        // Set default monospaced font
        $pdf->SetDefaultMonospacedFont(PDF_FONT_MONOSPACED);
        
        // Set margins
        $pdf->SetMargins(PDF_MARGIN_LEFT, PDF_MARGIN_TOP, PDF_MARGIN_RIGHT);
        $pdf->SetFooterMargin(PDF_MARGIN_FOOTER);
        
        // Set auto page breaks
        $pdf->SetAutoPageBreak(TRUE, PDF_MARGIN_BOTTOM);
        
        // Add a page
        $pdf->AddPage();
        
        // Set font
        $pdf->SetFont('helvetica', '', 12);
        
        // Tree information
        $pdf->SetFont('helvetica', 'B', 16);
        $pdf->Cell(0, 10, 'Family Tree: ' . $data['tree_info']['name'], 0, 1);
        $pdf->SetFont('helvetica', '', 12);
        $pdf->Ln(5);
        
        // Persons table
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(0, 10, 'Persons', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        // Table header
        $header = ['ID', 'Name', 'Gender', 'Birth Date', 'Death Date'];
        $w = [20, 60, 30, 40, 40];
        
        foreach($header as $i => $col) {
            $pdf->Cell($w[$i], 7, $col, 1);
        }
        $pdf->Ln();
        
        // Table data
        foreach($data['persons'] as $person) {
            $pdf->Cell($w[0], 6, $person['id'], 'LR');
            $pdf->Cell($w[1], 6, $person['first_name'] . ' ' . $person['last_name'], 'LR');
            $pdf->Cell($w[2], 6, $person['gender'], 'LR');
            $pdf->Cell($w[3], 6, $person['birth_date'], 'LR');
            $pdf->Cell($w[4], 6, $person['death_date'], 'LR');
            $pdf->Ln();
        }
        $pdf->Cell(array_sum($w), 0, '', 'T');
        
        // Relationships
        $pdf->AddPage();
        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->Cell(0, 10, 'Relationships', 0, 1);
        $pdf->SetFont('helvetica', '', 10);
        
        // Table header
        $header = ['Person 1', 'Relationship', 'Person 2', 'Date'];
        $w = [60, 30, 60, 40];
        
        foreach($header as $i => $col) {
            $pdf->Cell($w[$i], 7, $col, 1);
        }
        $pdf->Ln();
        
        // Table data
        foreach($data['relationships'] as $rel) {
            $person1 = $this->getPersonName($data['persons'], $rel['person1_id']);
            $person2 = $this->getPersonName($data['persons'], $rel['person2_id']);
            
            $pdf->Cell($w[0], 6, $person1, 'LR');
            $pdf->Cell($w[1], 6, $rel['type'], 'LR');
            $pdf->Cell($w[2], 6, $person2, 'LR');
            $pdf->Cell($w[3], 6, $rel['marriage_date'] ?? '', 'LR');
            $pdf->Ln();
        }
        $pdf->Cell(array_sum($w), 0, '', 'T');
        
        return $pdf->Output('', 'S');
    }

    private function exportToExcel($data) {
        require_once __DIR__ . '/../vendor/autoload.php';

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        
        // Persons sheet
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Persons');
        
        // Set headers
        $headers = ['ID', 'First Name', 'Last Name', 'Gender', 'Birth Date', 'Death Date', 'Parent1 ID', 'Parent2 ID'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getColumnDimension($col)->setAutoSize(true);
            $col++;
        }
        
        // Add data
        $row = 2;
        foreach ($data['persons'] as $person) {
            $sheet->setCellValue('A' . $row, $person['id']);
            $sheet->setCellValue('B' . $row, $person['first_name']);
            $sheet->setCellValue('C' . $row, $person['last_name']);
            $sheet->setCellValue('D' . $row, $person['gender']);
            $sheet->setCellValue('E' . $row, $person['birth_date']);
            $sheet->setCellValue('F' . $row, $person['death_date']);
            $sheet->setCellValue('G' . $row, $person['parent1_id']);
            $sheet->setCellValue('H' . $row, $person['parent2_id']);
            $row++;
        }
        
        // Style the header
        $sheet->getStyle('A1:H1')->getFont()->setBold(true);
        $sheet->getStyle('A1:H1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFCCCCCC');
        
        // Relationships sheet
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Relationships');
        
        // Set headers
        $headers = ['ID', 'Person1 ID', 'Person2 ID', 'Type', 'Marriage Date'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getColumnDimension($col)->setAutoSize(true);
            $col++;
        }
        
        // Add data
        $row = 2;
        foreach ($data['relationships'] as $rel) {
            $sheet->setCellValue('A' . $row, $rel['id']);
            $sheet->setCellValue('B' . $row, $rel['person1_id']);
            $sheet->setCellValue('C' . $row, $rel['person2_id']);
            $sheet->setCellValue('D' . $row, $rel['type']);
            $sheet->setCellValue('E' . $row, $rel['marriage_date'] ?? '');
            $row++;
        }
        
        // Style the header
        $sheet->getStyle('A1:E1')->getFont()->setBold(true);
        $sheet->getStyle('A1:E1')->getFill()
            ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
            ->getStartColor()->setARGB('FFCCCCCC');
        
        // Create Excel file
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        ob_start();
        $writer->save('php://output');
        return ob_get_clean();
    }

    private function getPersonName($persons, $personId) {
        foreach ($persons as $person) {
            if ($person['id'] == $personId) {
                return $person['first_name'] . ' ' . $person['last_name'];
            }
        }
        return 'Unknown';
    }

    public function findPossibleDuplicates($treeId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        if (!$this->treeModel->hasAccess($treeId, $_SESSION['user_id'])) {
            return $this->error('Access denied', 403);
        }

        $db = Database::getInstance();
        
        // Find potential duplicates based on name and birth date
        $duplicates = $db->query(
            "SELECT 
                p1.id as id1,
                p2.id as id2,
                p1.first_name as first_name1,
                p1.last_name as last_name1,
                p1.birth_date as birth_date1,
                p2.first_name as first_name2,
                p2.last_name as last_name2,
                p2.birth_date as birth_date2,
                CASE 
                    WHEN p1.birth_date = p2.birth_date THEN 100
                    WHEN ABS(YEAR(p1.birth_date) - YEAR(p2.birth_date)) <= 2 THEN 80
                    ELSE 60
                END +
                CASE 
                    WHEN p1.first_name = p2.first_name AND p1.last_name = p2.last_name THEN 100
                    WHEN p1.last_name = p2.last_name THEN 50
                    WHEN SOUNDEX(p1.last_name) = SOUNDEX(p2.last_name) THEN 30
                    ELSE 0
                END as similarity_score
            FROM persons p1
            JOIN persons p2 ON p1.id < p2.id
            WHERE p1.tree_id = ? AND p2.tree_id = ?
            AND (
                (p1.first_name = p2.first_name AND p1.last_name = p2.last_name)
                OR (SOUNDEX(p1.last_name) = SOUNDEX(p2.last_name) 
                    AND ABS(YEAR(p1.birth_date) - YEAR(p2.birth_date)) <= 5)
            )
            HAVING similarity_score >= 80
            ORDER BY similarity_score DESC",
            [$treeId, $treeId]
        )->fetchAll();

        return $this->response([
            'duplicates' => $duplicates
        ]);
    }

    public function mergeDuplicates($treeId, $person1Id, $person2Id, $keepPersonId) {
        $auth = $this->requireAuth();
        if ($auth !== true) return $auth;

        if (!$this->treeModel->hasAccess($treeId, $_SESSION['user_id'])) {
            return $this->error('Access denied', 403);
        }

        $db = Database::getInstance();
        
        try {
            $db->beginTransaction();

            // Verify both persons exist and belong to the tree
            $persons = $db->query(
                "SELECT * FROM persons 
                WHERE id IN (?, ?) AND tree_id = ?",
                [$person1Id, $person2Id, $treeId]
            )->fetchAll();

            if (count($persons) !== 2) {
                throw new Exception('Invalid person IDs');
            }

            if ($keepPersonId !== $person1Id && $keepPersonId !== $person2Id) {
                throw new Exception('Invalid keep_person_id');
            }

            $deletePersonId = ($keepPersonId === $person1Id) ? $person2Id : $person1Id;

            // Update all relationships to point to the kept person
            $db->query(
                "UPDATE relationships 
                SET person1_id = ? 
                WHERE person1_id = ? AND tree_id = ?",
                [$keepPersonId, $deletePersonId, $treeId]
            );

            $db->query(
                "UPDATE relationships 
                SET person2_id = ? 
                WHERE person2_id = ? AND tree_id = ?",
                [$keepPersonId, $deletePersonId, $treeId]
            );

            // Update parent references
            $db->query(
                "UPDATE persons 
                SET parent1_id = ? 
                WHERE parent1_id = ? AND tree_id = ?",
                [$keepPersonId, $deletePersonId, $treeId]
            );

            $db->query(
                "UPDATE persons 
                SET parent2_id = ? 
                WHERE parent2_id = ? AND tree_id = ?",
                [$keepPersonId, $deletePersonId, $treeId]
            );

            // Delete the duplicate person
            $db->query(
                "DELETE FROM persons WHERE id = ? AND tree_id = ?",
                [$deletePersonId, $treeId]
            );

            $db->commit();
            return $this->response(['success' => true]);

        } catch (Exception $e) {
            $db->rollBack();
            return $this->error($e->getMessage());
        }
    }
} 