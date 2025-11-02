<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Only admins can update website title']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $title = trim($_POST['title']);
    
    if (empty($title)) {
        echo json_encode(['success' => false, 'error' => 'Title cannot be empty']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE website_settings SET website_title = ? WHERE id = 1");
    $stmt->execute([$title]);
    
    echo json_encode(['success' => true, 'message' => 'Website title updated successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
