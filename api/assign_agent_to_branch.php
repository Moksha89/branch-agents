<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!hasModuleAccess('branches') || !hasFullAccess('branches')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to assign agents']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$branch_id = isset($_POST['branch_id']) ? intval($_POST['branch_id']) : 0;
$agent_id = isset($_POST['agent_id']) ? intval($_POST['agent_id']) : 0;

if ($branch_id <= 0 || $agent_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Branch ID and Agent ID are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id FROM branches WHERE id = ?");
    $stmt->execute([$branch_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Branch not found']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT id FROM agents WHERE id = ? AND status = 'active'");
    $stmt->execute([$agent_id]);
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Agent not found or inactive']);
        exit;
    }
    
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("UPDATE branches SET agent_id = ? WHERE id = ?");
    $stmt->execute([$agent_id, $branch_id]);
    
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM agent_branches WHERE agent_id = ? AND branch_id = ?");
    $stmt->execute([$agent_id, $branch_id]);
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO agent_branches (agent_id, branch_id) VALUES (?, ?)");
        $stmt->execute([$agent_id, $branch_id]);
    }
    
    $pdo->commit();
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
