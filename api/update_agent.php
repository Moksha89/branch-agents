<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');

if (!isset($_SESSION['admin_id'])) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$agentId = isset($_POST['agent_id']) ? intval($_POST['agent_id']) : 0;
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : '';
$phones = isset($_POST['phones']) ? $_POST['phones'] : [];

if ($agentId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid agent ID']);
    exit;
}

if (empty($name)) {
    echo json_encode(['success' => false, 'error' => 'Agent name is required']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    $stmt = $pdo->prepare("UPDATE agents SET name = ?, updated_at = NOW() WHERE id = ?");
    $stmt->execute([$name, $agentId]);
    
    $stmt = $pdo->prepare("DELETE FROM agent_phones WHERE agent_id = ?");
    $stmt->execute([$agentId]);
    
    if (!empty($phones) && is_array($phones)) {
        $stmt = $pdo->prepare("INSERT INTO agent_phones (agent_id, phone, is_primary) VALUES (?, ?, ?)");
        foreach ($phones as $index => $phone) {
            $phone = trim($phone);
            if (!empty($phone)) {
                $isPrimary = ($index === 0) ? 1 : 0;
                $stmt->execute([$agentId, $phone, $isPrimary]);
            }
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Agent updated successfully'
    ]);
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
