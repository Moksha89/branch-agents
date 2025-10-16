<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!hasModuleAccess('branches') || !hasFullAccess('branches')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to unassign agents']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$branch_id = isset($_POST['branch_id']) ? intval($_POST['branch_id']) : 0;

if ($branch_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Branch ID is required']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, agent_id FROM branches WHERE id = ?");
    $stmt->execute([$branch_id]);
    $branch = $stmt->fetch();
    
    if (!$branch) {
        echo json_encode(['success' => false, 'error' => 'Branch not found']);
        exit;
    }
    
    if (!$branch['agent_id']) {
        echo json_encode(['success' => false, 'error' => 'Branch has no agent assigned']);
        exit;
    }
    
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("UPDATE branches SET agent_id = NULL WHERE id = ?");
    $stmt->execute([$branch_id]);
    
    $stmt = $pdo->prepare("DELETE FROM agent_branches WHERE agent_id = ? AND branch_id = ?");
    $stmt->execute([$branch['agent_id'], $branch_id]);
    
    $pdo->commit();
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
