<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Only admins can toggle agent status']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $agentId = isset($_POST['agent_id']) ? intval($_POST['agent_id']) : 0;
    $status = isset($_POST['status']) ? intval($_POST['status']) : 0;
    
    if ($agentId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid agent ID']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE agents SET still_active = ? WHERE id = ?");
    $stmt->execute([$status, $agentId]);
    
    $statusText = $status ? 'activated' : 'deactivated';
    echo json_encode(['success' => true, 'message' => "Agent $statusText successfully"]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
