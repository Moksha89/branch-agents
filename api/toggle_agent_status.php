<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$agentId = isset($_POST['agent_id']) ? intval($_POST['agent_id']) : 0;

if ($agentId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid agent ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE agents SET is_active = NOT is_active, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$agentId]);
    
    $stmt = $pdo->prepare("SELECT is_active FROM agents WHERE id = ?");
    $stmt->execute([$agentId]);
    $agent = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'is_active' => (bool)$agent['is_active'],
        'message' => $agent['is_active'] ? 'Agent activated' : 'Agent deactivated'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
