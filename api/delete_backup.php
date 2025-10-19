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
    
    if (file_exists($backupFilePath)) {
        unlink($backupFilePath);
    }
    
    $stmt = $pdo->prepare("DELETE FROM backups WHERE id = ?");
    $stmt->execute([$backupId]);
    
    echo json_encode(['success' => true, 'message' => 'Backup deleted successfully']);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
