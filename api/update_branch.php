<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasFullAccess('branches')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to update branches']);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$branchId = isset($_POST['branch_id']) ? intval($_POST['branch_id']) : 0;
$siteId = isset($_POST['site_id']) ? intval($_POST['site_id']) : 0;
$branchCode = isset($_POST['branch_code']) ? sanitizeInput($_POST['branch_code']) : '';
$balance = isset($_POST['balance']) ? floatval($_POST['balance']) : 0;
$agentId = isset($_POST['agent_id']) && !empty($_POST['agent_id']) ? intval($_POST['agent_id']) : null;

if (!canAccessBranch($branchId)) {
    echo json_encode(['success' => false, 'error' => 'You do not have access to this branch']);
    exit;
}

if ($branchId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid branch ID']);
    exit;
}

if ($siteId <= 0 || empty($branchCode)) {
    echo json_encode(['success' => false, 'error' => 'Site and branch code are required']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE branches SET site_id = ?, branch_code = ?, balance = ?, agent_id = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$siteId, $branchCode, $balance, $agentId, $branchId]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Branch updated successfully'
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
