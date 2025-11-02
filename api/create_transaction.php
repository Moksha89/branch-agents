<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!hasModuleAccess('transactions') || !hasFullAccess('transactions')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to create transactions']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$sender_id = isset($_POST['sender_id']) ? intval($_POST['sender_id']) : 0;
$receiver_id = isset($_POST['receiver_id']) ? intval($_POST['receiver_id']) : 0;
$amount = isset($_POST['amount']) ? floatval($_POST['amount']) : 0;
$transaction_date = isset($_POST['transaction_date']) ? $_POST['transaction_date'] : '';
$remarks = isset($_POST['remarks']) ? sanitizeInput($_POST['remarks']) : '';

if ($sender_id <= 0 || $receiver_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Sender and receiver are required']);
    exit;
}

if ($sender_id === $receiver_id) {
    echo json_encode(['success' => false, 'error' => 'Sender and receiver cannot be the same']);
    exit;
}

if ($amount <= 0) {
    echo json_encode(['success' => false, 'error' => 'Amount must be greater than zero']);
    exit;
}

if (empty($transaction_date)) {
    echo json_encode(['success' => false, 'error' => 'Transaction date is required']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("SELECT id, name, balance FROM agents WHERE id = ? AND status = 'active' FOR UPDATE");
    $stmt->execute([$sender_id]);
    $sender = $stmt->fetch();
    
    if (!$sender) {
        throw new Exception('Sender not found or inactive');
    }
    
    $stmt = $pdo->prepare("SELECT id, name, balance FROM agents WHERE id = ? AND status = 'active' FOR UPDATE");
    $stmt->execute([$receiver_id]);
    $receiver = $stmt->fetch();
    
    if (!$receiver) {
        throw new Exception('Receiver not found or inactive');
    }
    
    $sender_opening = $sender['balance'];
    $receiver_opening = $receiver['balance'];
    $sender_closing = $sender_opening - $amount;
    $receiver_closing = $receiver_opening + $amount;
    
    $transaction_code = 'TXN' . date('Ymd') . str_pad(mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("
        INSERT INTO transactions (
            transaction_code, sender_id, receiver_id, amount,
            sender_opening_balance, sender_closing_balance,
            receiver_opening_balance, receiver_closing_balance,
            remarks, transaction_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $transaction_code,
        $sender_id,
        $receiver_id,
        $amount,
        $sender_opening,
        $sender_closing,
        $receiver_opening,
        $receiver_closing,
        $remarks,
        $transaction_date,
        $_SESSION['user_id']
    ]);
    
    $stmt = $pdo->prepare("UPDATE agents SET balance = ? WHERE id = ?");
    $stmt->execute([$sender_closing, $sender_id]);
    
    $stmt = $pdo->prepare("UPDATE agents SET balance = ? WHERE id = ?");
    $stmt->execute([$receiver_closing, $receiver_id]);
    
    $stmt = $pdo->prepare("
        UPDATE branches b
        JOIN agent_branches ab ON b.id = ab.branch_id
        SET b.balance = (
            SELECT SUM(b2.balance) 
            FROM branches b2 
            JOIN agent_branches ab2 ON b2.id = ab2.branch_id 
            WHERE ab2.agent_id = ab.agent_id
        )
        WHERE ab.agent_id IN (?, ?)
    ");
    $stmt->execute([$sender_id, $receiver_id]);
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'transaction_code' => $transaction_code,
        'sender_new_balance' => $sender_closing,
        'receiver_new_balance' => $receiver_closing
    ]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
