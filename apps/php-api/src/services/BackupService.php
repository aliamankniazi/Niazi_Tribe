<?php

require_once __DIR__ . '/../includes/Database.php';
require_once __DIR__ . '/../includes/Logger.php';

class BackupService {
    private $db;
    private $logger;
    private $config;
    private $backupDir;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->logger = new Logger();
        $this->config = require __DIR__ . '/../config/backup.php';
        $this->backupDir = $this->config['backup_dir'];

        if (!file_exists($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }

    public function createBackup($type = 'full') {
        try {
            $timestamp = date('Y-m-d_H-i-s');
            $backupPath = "{$this->backupDir}/{$type}_{$timestamp}";
            mkdir($backupPath, 0755, true);

            switch ($type) {
                case 'full':
                    $this->backupDatabase($backupPath);
                    $this->backupUploads($backupPath);
                    $this->backupConfig($backupPath);
                    break;

                case 'database':
                    $this->backupDatabase($backupPath);
                    break;

                case 'uploads':
                    $this->backupUploads($backupPath);
                    break;

                default:
                    throw new Exception("Invalid backup type: {$type}");
            }

            // Create metadata file
            $metadata = [
                'type' => $type,
                'timestamp' => $timestamp,
                'size' => $this->getDirectorySize($backupPath),
                'files' => $this->listBackupFiles($backupPath)
            ];

            file_put_contents(
                "{$backupPath}/metadata.json",
                json_encode($metadata, JSON_PRETTY_PRINT)
            );

            // Log backup creation
            $this->logger->info('Backup created', [
                'type' => $type,
                'path' => $backupPath,
                'size' => $metadata['size']
            ]);

            // Store backup record
            $this->db->query(
                "INSERT INTO backups (
                    type, path, size, created_at, status
                ) VALUES (?, ?, ?, NOW(), 'completed')",
                [$type, $backupPath, $metadata['size']]
            );

            // Clean old backups
            $this->cleanOldBackups();

            return [
                'success' => true,
                'message' => 'Backup created successfully',
                'metadata' => $metadata
            ];

        } catch (Exception $e) {
            $this->logger->error('Backup failed', [
                'type' => $type,
                'error' => $e->getMessage()
            ]);

            if (isset($backupPath) && file_exists($backupPath)) {
                $this->deleteDirectory($backupPath);
            }

            throw $e;
        }
    }

    private function backupDatabase($backupPath) {
        $dbConfig = require __DIR__ . '/../config/database.php';
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "{$backupPath}/database_{$timestamp}.sql";

        // Create dump command
        $command = sprintf(
            'mysqldump -h %s -u %s -p%s %s > %s',
            escapeshellarg($dbConfig['host']),
            escapeshellarg($dbConfig['username']),
            escapeshellarg($dbConfig['password']),
            escapeshellarg($dbConfig['database']),
            escapeshellarg($filename)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Database backup failed');
        }

        // Compress the dump
        $command = "gzip {$filename}";
        exec($command);
    }

    private function backupUploads($backupPath) {
        $uploadsDir = $this->config['uploads_dir'];
        if (!file_exists($uploadsDir)) {
            return;
        }

        $timestamp = date('Y-m-d_H-i-s');
        $filename = "{$backupPath}/uploads_{$timestamp}.tar.gz";

        $command = sprintf(
            'tar -czf %s -C %s .',
            escapeshellarg($filename),
            escapeshellarg($uploadsDir)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Uploads backup failed');
        }
    }

    private function backupConfig($backupPath) {
        $configDir = __DIR__ . '/../config';
        $timestamp = date('Y-m-d_H-i-s');
        $filename = "{$backupPath}/config_{$timestamp}.tar.gz";

        $command = sprintf(
            'tar -czf %s -C %s .',
            escapeshellarg($filename),
            escapeshellarg($configDir)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Config backup failed');
        }
    }

    public function restoreBackup($backupId) {
        try {
            // Get backup details
            $backup = $this->db->query(
                "SELECT * FROM backups WHERE id = ?",
                [$backupId]
            )->fetch();

            if (!$backup) {
                throw new Exception('Backup not found');
            }

            if (!file_exists($backup['path'])) {
                throw new Exception('Backup files not found');
            }

            // Read metadata
            $metadata = json_decode(
                file_get_contents("{$backup['path']}/metadata.json"),
                true
            );

            // Start restoration
            $this->db->query(
                "UPDATE backups 
                SET status = 'restoring', 
                    restored_at = NOW() 
                WHERE id = ?",
                [$backupId]
            );

            switch ($metadata['type']) {
                case 'full':
                    $this->restoreDatabase($backup['path']);
                    $this->restoreUploads($backup['path']);
                    $this->restoreConfig($backup['path']);
                    break;

                case 'database':
                    $this->restoreDatabase($backup['path']);
                    break;

                case 'uploads':
                    $this->restoreUploads($backup['path']);
                    break;
            }

            // Update status
            $this->db->query(
                "UPDATE backups 
                SET status = 'restored' 
                WHERE id = ?",
                [$backupId]
            );

            $this->logger->info('Backup restored', [
                'backup_id' => $backupId,
                'type' => $metadata['type']
            ]);

            return [
                'success' => true,
                'message' => 'Backup restored successfully'
            ];

        } catch (Exception $e) {
            $this->logger->error('Backup restoration failed', [
                'backup_id' => $backupId,
                'error' => $e->getMessage()
            ]);

            if (isset($backupId)) {
                $this->db->query(
                    "UPDATE backups 
                    SET status = 'restore_failed' 
                    WHERE id = ?",
                    [$backupId]
                );
            }

            throw $e;
        }
    }

    private function restoreDatabase($backupPath) {
        $dbConfig = require __DIR__ . '/../config/database.php';
        $dumpFile = glob("{$backupPath}/database_*.sql.gz")[0];

        if (!$dumpFile) {
            throw new Exception('Database dump not found in backup');
        }

        // Uncompress dump
        $command = "gunzip -c " . escapeshellarg($dumpFile);
        $command .= " | mysql";
        $command .= " -h " . escapeshellarg($dbConfig['host']);
        $command .= " -u " . escapeshellarg($dbConfig['username']);
        $command .= " -p" . escapeshellarg($dbConfig['password']);
        $command .= " " . escapeshellarg($dbConfig['database']);

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Database restoration failed');
        }
    }

    private function restoreUploads($backupPath) {
        $uploadsArchive = glob("{$backupPath}/uploads_*.tar.gz")[0];
        if (!$uploadsArchive) {
            return; // Skip if no uploads backup
        }

        $uploadsDir = $this->config['uploads_dir'];
        if (!file_exists($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        $command = sprintf(
            'tar -xzf %s -C %s',
            escapeshellarg($uploadsArchive),
            escapeshellarg($uploadsDir)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Uploads restoration failed');
        }
    }

    private function restoreConfig($backupPath) {
        $configArchive = glob("{$backupPath}/config_*.tar.gz")[0];
        if (!$configArchive) {
            return; // Skip if no config backup
        }

        $configDir = __DIR__ . '/../config';
        $command = sprintf(
            'tar -xzf %s -C %s',
            escapeshellarg($configArchive),
            escapeshellarg($configDir)
        );

        exec($command, $output, $returnVar);

        if ($returnVar !== 0) {
            throw new Exception('Config restoration failed');
        }
    }

    public function listBackups() {
        return $this->db->query(
            "SELECT * FROM backups 
            ORDER BY created_at DESC"
        )->fetchAll();
    }

    public function getBackupDetails($backupId) {
        $backup = $this->db->query(
            "SELECT * FROM backups WHERE id = ?",
            [$backupId]
        )->fetch();

        if (!$backup) {
            throw new Exception('Backup not found');
        }

        if (file_exists("{$backup['path']}/metadata.json")) {
            $backup['metadata'] = json_decode(
                file_get_contents("{$backup['path']}/metadata.json"),
                true
            );
        }

        return $backup;
    }

    public function deleteBackup($backupId) {
        $backup = $this->getBackupDetails($backupId);

        // Delete files
        if (file_exists($backup['path'])) {
            $this->deleteDirectory($backup['path']);
        }

        // Delete record
        $this->db->query(
            "DELETE FROM backups WHERE id = ?",
            [$backupId]
        );

        $this->logger->info('Backup deleted', [
            'backup_id' => $backupId,
            'path' => $backup['path']
        ]);

        return [
            'success' => true,
            'message' => 'Backup deleted successfully'
        ];
    }

    private function cleanOldBackups() {
        $maxAge = $this->config['retention_days'] * 86400;
        $maxBackups = $this->config['max_backups'];

        // Delete old backups
        $oldBackups = $this->db->query(
            "SELECT * FROM backups 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
            [$this->config['retention_days']]
        )->fetchAll();

        foreach ($oldBackups as $backup) {
            $this->deleteBackup($backup['id']);
        }

        // Keep only max number of backups
        $backups = $this->db->query(
            "SELECT * FROM backups 
            ORDER BY created_at DESC"
        )->fetchAll();

        if (count($backups) > $maxBackups) {
            for ($i = $maxBackups; $i < count($backups); $i++) {
                $this->deleteBackup($backups[$i]['id']);
            }
        }
    }

    private function getDirectorySize($path) {
        $size = 0;
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path)) as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }
        return $size;
    }

    private function listBackupFiles($path) {
        $files = [];
        foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path)) as $file) {
            if ($file->isFile()) {
                $files[] = [
                    'name' => $file->getFilename(),
                    'size' => $file->getSize(),
                    'modified' => date('Y-m-d H:i:s', $file->getMTime())
                ];
            }
        }
        return $files;
    }

    private function deleteDirectory($path) {
        if (!file_exists($path)) {
            return;
        }

        $files = array_diff(scandir($path), ['.', '..']);
        foreach ($files as $file) {
            $fullPath = "{$path}/{$file}";
            is_dir($fullPath) ? $this->deleteDirectory($fullPath) : unlink($fullPath);
        }
        return rmdir($path);
    }
} 