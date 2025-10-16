<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasFullAccess('masters')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to delete masters']);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$id = intval($_POST['id'] ?? 0);

if ($id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid master ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("DELETE FROM masters WHERE id = ?");
    $stmt->execute([$id]);
    
    echo json_encode(['success' => true, 'message' => 'Master deleted successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
