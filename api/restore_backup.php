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

$backupId = isset($_POST['id']) ? intval($_POST['id']) : 0;

if ($backupId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid backup ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM backups WHERE id = ?");
    $stmt->execute([$backupId]);
    $backup = $stmt->fetch();
    
    if (!$backup) {
        throw new Exception('Backup not found');
    }
    
    $backupFilePath = __DIR__ . '/../backups/' . $backup['file_url'];
    
    if (!file_exists($backupFilePath)) {
        throw new Exception('Backup file not found on server');
    }
    
    $encryptedData = file_get_contents($backupFilePath);
    $decryptedData = decryptBackupData($encryptedData);
    
    if (!$decryptedData) {
        throw new Exception('Failed to decrypt backup data');
    }
    
    $data = json_decode($decryptedData, true);
    if (!$data) {
        throw new Exception('Failed to parse decrypted data');
    }
    
    $pdo->beginTransaction();
    
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    
    $tables = [
        'employee_module_access', 'employee_site_access', 'employees',
        'whatsapp_logs', 'agent_phones', 'agent_branches',
        'transactions', 'masters', 'agents', 'branches', 'sites'
    ];
    
    foreach ($tables as $table) {
        if (isset($data[$table]) && !empty($data[$table])) {
            $pdo->exec("TRUNCATE TABLE $table");
            
            foreach ($data[$table] as $row) {
                $columns = array_keys($row);
                $placeholders = array_fill(0, count($columns), '?');
                
                $sql = "INSERT INTO $table (" . implode(', ', $columns) . ") 
                        VALUES (" . implode(', ', $placeholders) . ")";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array_values($row));
            }
        }
    }
    
    if (isset($data['admins']) && !empty($data['admins'])) {
        foreach ($data['admins'] as $admin) {
            $stmt = $pdo->prepare("
                INSERT INTO admins (id, mobile, password, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                mobile = VALUES(mobile),
                password = VALUES(password),
                updated_at = VALUES(updated_at)
            ");
            $stmt->execute([
                $admin['id'], $admin['mobile'], $admin['password'],
                $admin['created_at'], $admin['updated_at']
            ]);
        }
    }
    
    if (isset($data['whatsapp_config']) && !empty($data['whatsapp_config'])) {
        $config = $data['whatsapp_config'][0];
        $stmt = $pdo->prepare("UPDATE whatsapp_config SET 
            api_url = ?, api_key = ?, phone_number_id = ?, access_token = ?,
            session_token = ?, api_type = ?, facebook_app_id = ?, facebook_app_secret = ?,
            is_active = ?, updated_at = ?
            WHERE id = 1");
        $stmt->execute([
            $config['api_url'], $config['api_key'], $config['phone_number_id'],
            $config['access_token'], $config['session_token'], $config['api_type'],
            $config['facebook_app_id'], $config['facebook_app_secret'],
            $config['is_active'], $config['updated_at']
        ]);
    }
    
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Backup restored successfully']);
    
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
