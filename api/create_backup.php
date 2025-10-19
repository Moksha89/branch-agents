<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!isAdmin()) {
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

try {
    $backupPath = __DIR__ . '/../backups/';
    
    if (!is_dir($backupPath)) {
        mkdir($backupPath, 0755, true);
    }
    
    $tables = [
        'sites', 'branches', 'agents', 'agent_branches', 'agent_phones',
        'transactions', 'admins', 'employees', 'employee_site_access', 
        'employee_module_access', 'whatsapp_config', 'whatsapp_logs', 'masters'
    ];
    
    $data = [];
    foreach ($tables as $table) {
        $tableExists = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if ($tableExists) {
            $stmt = $pdo->query("SELECT * FROM $table");
            $data[$table] = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    $jsonData = json_encode($data);
    
    $encryptedData = encryptBackupData($jsonData);
    
    $timestamp = time();
    $backupFileName = "backup_$timestamp.hbx";
    $backupFilePath = $backupPath . $backupFileName;
    
    if (file_put_contents($backupFilePath, $encryptedData) === false) {
        throw new Exception("Failed to write backup file");
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO backups (timestamp, file_url, created_by)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$timestamp, $backupFileName, $_SESSION['admin_id']]);
    
    echo json_encode([
        'success' => true,
        'backup_file' => $backupFileName,
        'timestamp' => $timestamp
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
