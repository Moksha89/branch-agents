<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/helpers.php';

header('Content-Type: application/json');
requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $transactionId = isset($_POST['transaction_id']) ? intval($_POST['transaction_id']) : 0;
    
    if ($transactionId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid transaction ID']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
    $stmt->execute([$transactionId]);
    $transaction = $stmt->fetch();
    
    if (!$transaction) {
        echo json_encode(['success' => false, 'error' => 'Transaction not found']);
        exit;
    }
    
    if (!$transaction['deleted']) {
        echo json_encode(['success' => false, 'error' => 'Transaction is not deleted']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE transactions SET deleted = 0, modified = 0 WHERE id = ?");
    $stmt->execute([$transactionId]);
    
    if ($transaction['sender_id']) {
        recalculateBalance($transaction['sender_id']);
    }
    if ($transaction['receiver_id']) {
        recalculateBalance($transaction['receiver_id']);
    }
    if ($transaction['branch_id']) {
        recalculateBranchBalance($transaction['branch_id']);
    }
    
    echo json_encode(['success' => true, 'message' => 'Transaction restored successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
