<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $sessionToken = $_POST['session_token'] ?? '';
    
    try {
        $stmt = $pdo->prepare("UPDATE whatsapp_config SET session_token = ? WHERE id = 1");
        $stmt->execute([$sessionToken]);
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
}
