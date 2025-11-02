<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!hasModuleAccess('transactions') || !hasFullAccess('transactions')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to delete transactions']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Transaction ID is required']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("
        SELECT * FROM transactions 
        WHERE id = ? AND deleted_at IS NULL
    ");
    $stmt->execute([$id]);
    $transaction = $stmt->fetch();
    
    if (!$transaction) {
        throw new Exception('Transaction not found or already deleted');
    }
    
    $stmt = $pdo->prepare("
        UPDATE transactions 
        SET deleted_at = NOW() 
        WHERE id = ?
    ");
    $stmt->execute([$id]);
    
    $stmt = $pdo->prepare("SELECT id, balance FROM agents WHERE id = ? FOR UPDATE");
    $stmt->execute([$transaction['sender_id']]);
    $sender = $stmt->fetch();
    
    $stmt = $pdo->prepare("SELECT id, balance FROM agents WHERE id = ? FOR UPDATE");
    $stmt->execute([$transaction['receiver_id']]);
    $receiver = $stmt->fetch();
    
    if ($sender) {
        $new_sender_balance = $sender['balance'] + $transaction['amount'];
        $stmt = $pdo->prepare("UPDATE agents SET balance = ? WHERE id = ?");
        $stmt->execute([$new_sender_balance, $sender['id']]);
    }
    
    if ($receiver) {
        $new_receiver_balance = $receiver['balance'] - $transaction['amount'];
        $stmt = $pdo->prepare("UPDATE agents SET balance = ? WHERE id = ?");
        $stmt->execute([$new_receiver_balance, $receiver['id']]);
    }
    
    $pdo->commit();
    
    echo json_encode(['success' => true]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
