<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$name = sanitizeInput($_POST['name'] ?? '');
$mobile_number = sanitizeInput($_POST['mobile_number'] ?? '');

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Master name is required']);
    exit;
}

if (empty($mobile_number) || !preg_match('/^[0-9]{10}$/', $mobile_number)) {
    echo json_encode(['success' => false, 'error' => 'Valid 10-digit mobile number is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO masters (name, mobile_number) VALUES (?, ?)");
    $stmt->execute([$name, $mobile_number]);
    
    echo json_encode([
        'success' => true,
        'master_id' => $pdo->lastInsertId(),
        'message' => 'Master created successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
