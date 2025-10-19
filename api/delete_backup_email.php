<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!hasBackupTabAccess() && !isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    
    if ($id <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid email ID']);
        exit;
    }
    
    $stmt = $pdo->prepare("DELETE FROM backup_emails WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Email deleted successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
