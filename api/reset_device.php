<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Only admins can reset devices']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $userId = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
    
    if ($userId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid user ID']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE admins SET first_device_id = NULL WHERE id = ?");
    $stmt->execute([$userId]);
    
    echo json_encode(['success' => true, 'message' => 'Device reset successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
