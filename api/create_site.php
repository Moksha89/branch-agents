<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasFullAccess('sites')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to create sites']);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$name = sanitizeInput($_POST['name'] ?? '');

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Site name is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO sites (name) VALUES (?)");
    $stmt->execute([$name]);
    
    echo json_encode([
        'success' => true,
        'site_id' => $pdo->lastInsertId(),
        'message' => 'Site created successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
