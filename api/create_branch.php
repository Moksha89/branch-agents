<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$site_id = intval($_POST['site_id'] ?? 0);
$branch_code = sanitizeInput($_POST['branch_code'] ?? '');
$balance = floatval($_POST['balance'] ?? 0);
$agent_id = !empty($_POST['agent_id']) ? intval($_POST['agent_id']) : null;

if ($site_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Site is required']);
    exit;
}

if (empty($branch_code)) {
    echo json_encode(['success' => false, 'error' => 'Branch code is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM branches WHERE site_id = ? AND branch_code = ?");
    $stmt->execute([$site_id, $branch_code]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Branch code already exists for this site']);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO branches (site_id, branch_code, balance, agent_id) VALUES (?, ?, ?, ?)");
    $stmt->execute([$site_id, $branch_code, $balance, $agent_id]);
    
    echo json_encode([
        'success' => true,
        'branch_id' => $pdo->lastInsertId(),
        'message' => 'Branch created successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
