<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/whatsapp.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if (!isset($_SESSION['whatsapp_session_token']) || empty($_SESSION['whatsapp_session_token'])) {
    echo json_encode(['success' => false, 'error' => 'WhatsApp is not connected. Please connect WhatsApp in Settings → WhatsApp Connection.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$agentId = isset($_POST['agent_id']) ? intval($_POST['agent_id']) : 0;

if ($agentId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid agent ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT phone FROM agent_phones 
        WHERE agent_id = ? AND is_primary = 1
        LIMIT 1
    ");
    $stmt->execute([$agentId]);
    $phone = $stmt->fetch();
    
    if (!$phone) {
        $stmt = $pdo->prepare("
            SELECT phone FROM agent_phones 
            WHERE agent_id = ?
            LIMIT 1
        ");
        $stmt->execute([$agentId]);
        $phone = $stmt->fetch();
    }
    
    if (!$phone) {
        echo json_encode(['success' => false, 'error' => 'No phone number found for this agent']);
        exit;
    }
    
    $message = generateAgentReport($agentId);
    
    if (!$message) {
        echo json_encode(['success' => false, 'error' => 'Could not generate report']);
        exit;
    }
    
    $result = sendWhatsAppMessage($phone['phone'], $message);
    
    if ($result['success']) {
        echo json_encode(['success' => true, 'message' => 'Report sent successfully']);
    } else {
        echo json_encode(['success' => false, 'error' => $result['error']]);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
