<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

header('Content-Type: application/json');

if (!isAdmin()) {
    echo json_encode(['success' => false, 'error' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $authMethod = $_POST['auth_method'] ?? '';
    
    if (!in_array($authMethod, ['web', 'business'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid authentication method']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE whatsapp_config SET api_type = ? WHERE id = 1");
        $stmt->execute([$authMethod]);
        
        echo json_encode(['success' => true, 'message' => 'Authentication method updated']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
