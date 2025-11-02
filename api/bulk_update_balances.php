<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasFullAccess('branches')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to update balances']);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$updates = json_decode(file_get_contents('php://input'), true);

if (!is_array($updates) || empty($updates)) {
    echo json_encode(['success' => false, 'error' => 'No updates provided']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $updated = 0;
    $stmt = $pdo->prepare("UPDATE branches SET balance = ? WHERE id = ?");
    
    foreach ($updates as $update) {
        if (!isset($update['branch_id']) || !isset($update['balance'])) {
            continue;
        }
        
        $branchId = intval($update['branch_id']);
        $balance = floatval($update['balance']);
        
        $stmt->execute([$balance, $branchId]);
        $updated += $stmt->rowCount();
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'updated' => $updated,
        'message' => "Successfully updated $updated branch(es)"
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
