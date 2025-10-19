<?php
require_once '../config/config.php';
require_once '../config/database.php';

requireLogin();

if (!isAdmin()) {
    redirect(SITE_URL . '/dashboard.php');
}

$backupId = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($backupId <= 0) {
    die('Invalid backup ID');
}

try {
    $stmt = $pdo->prepare("SELECT * FROM backups WHERE id = ?");
    $stmt->execute([$backupId]);
    $backup = $stmt->fetch();
    
    if (!$backup) {
        die('Backup not found');
    }
    
    $backupFilePath = __DIR__ . '/../backups/' . $backup['file_url'];
    
    if (!file_exists($backupFilePath)) {
        die('Backup file not found on server');
    }
    
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . $backup['file_url'] . '"');
    header('Content-Length: ' . filesize($backupFilePath));
    header('Cache-Control: no-cache');
    
    readfile($backupFilePath);
    exit;
    
} catch (Exception $e) {
    die('Error: ' . $e->getMessage());
}
