<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

if (!hasFullAccess('agents')) {
    echo json_encode(['success' => false, 'error' => 'You do not have permission to create agents']);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$name = sanitizeInput($_POST['name'] ?? '');
$phones = $_POST['phones'] ?? [];
$primary_index = intval($_POST['primary_index'] ?? 0);

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Agent name is required']);
    exit;
}

if (empty($phones) || !is_array($phones)) {
    echo json_encode(['success' => false, 'error' => 'At least one phone number is required']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("INSERT INTO agents (name) VALUES (?)");
    $stmt->execute([$name]);
    $agent_id = $pdo->lastInsertId();
    
    $stmt = $pdo->prepare("INSERT INTO agent_phones (agent_id, phone, is_primary) VALUES (?, ?, ?)");
    foreach ($phones as $index => $phone) {
        $phone = sanitizeInput($phone);
        if (!empty($phone)) {
            $is_primary = ($index == $primary_index) ? 1 : 0;
            $stmt->execute([$agent_id, $phone, $is_primary]);
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'agent_id' => $agent_id,
        'message' => 'Agent created successfully'
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
