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
    $branchId = isset($_POST['branch_id']) ? intval($_POST['branch_id']) : 0;
    $senderId = isset($_POST['sender_id']) ? intval($_POST['sender_id']) : null;
    $receiverId = isset($_POST['receiver_id']) ? intval($_POST['receiver_id']) : null;
    $coins = isset($_POST['coins']) ? floatval($_POST['coins']) : 0;
    $rate = isset($_POST['rate']) ? floatval($_POST['rate']) : 1.0;
    $amount = $coins * $rate;
    $remarks = isset($_POST['remarks']) ? trim($_POST['remarks']) : '';
    $transactionDate = isset($_POST['transaction_date']) ? $_POST['transaction_date'] : date('Y-m-d');
    
    if ($transactionId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid transaction ID']);
        exit;
    }
    
    if ($branchId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Branch is required']);
        exit;
    }
    
    if ($coins == 0) {
        echo json_encode(['success' => false, 'error' => 'Coins cannot be zero']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE id = ?");
    $stmt->execute([$transactionId]);
    $oldTransaction = $stmt->fetch();
    
    if (!$oldTransaction) {
        echo json_encode(['success' => false, 'error' => 'Transaction not found']);
        exit;
    }
    
    $stmt = $pdo->prepare("
        UPDATE transactions 
        SET branch_id = ?, sender_id = ?, receiver_id = ?, 
            coins = ?, rate = ?, amount = ?, remarks = ?, 
            transaction_date = ?, modified = 1
        WHERE id = ?
    ");
    $stmt->execute([
        $branchId, $senderId, $receiverId,
        $coins, $rate, $amount, $remarks,
        $transactionDate, $transactionId
    ]);
    
    $affectedAgents = [];
    if ($oldTransaction['sender_id']) $affectedAgents[] = $oldTransaction['sender_id'];
    if ($oldTransaction['receiver_id']) $affectedAgents[] = $oldTransaction['receiver_id'];
    if ($senderId) $affectedAgents[] = $senderId;
    if ($receiverId) $affectedAgents[] = $receiverId;
    
    $affectedAgents = array_unique($affectedAgents);
    foreach ($affectedAgents as $agentId) {
        recalculateBalance($agentId);
    }
    
    $affectedBranches = [];
    if ($oldTransaction['branch_id']) $affectedBranches[] = $oldTransaction['branch_id'];
    if ($branchId) $affectedBranches[] = $branchId;
    
    $affectedBranches = array_unique($affectedBranches);
    foreach ($affectedBranches as $bId) {
        recalculateBranchBalance($bId);
    }
    
    echo json_encode(['success' => true, 'message' => 'Transaction updated successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
