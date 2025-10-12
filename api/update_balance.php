<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$branchId = isset($_POST['branch_id']) ? intval($_POST['branch_id']) : 0;
$balance = isset($_POST['balance']) ? floatval($_POST['balance']) : 0;

if ($branchId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid branch ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE branches SET balance = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$balance, $branchId]);
    
    echo json_encode([
        'success' => true,
        'balance' => $balance,
        'formatted_balance' => formatCurrency($balance)
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
