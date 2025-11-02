<?php
require_once '../config/config.php';
require_once '../config/database.php';
require_once '../config/whatsapp.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$masterPhone = sanitizeInput($_POST['master_phone'] ?? '');
$masterName = sanitizeInput($_POST['master_name'] ?? '');
$agentId = intval($_POST['agent_id'] ?? 0);
$format = sanitizeInput($_POST['format'] ?? 'text_image');

if (empty($masterPhone)) {
    echo json_encode(['success' => false, 'error' => 'Master phone number is required']);
    exit;
}

if ($agentId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid agent ID']);
    exit;
}

if (!in_array($format, ['text_only', 'text_image', 'image_only'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid format. Must be text_only, text_image, or image_only']);
    exit;
}

try {
    $message = generateAgentReport($agentId);
    
    if (!$message) {
        echo json_encode(['success' => false, 'error' => 'Could not generate report']);
        exit;
    }
    
    $result = null;
    
    if ($format === 'text_only') {
        $result = sendWhatsAppMessage($masterPhone, $message, null);
    } 
    elseif ($format === 'image_only') {
        $imagePath = generateBranchDetailsPNG($agentId);
        if ($imagePath) {
            $result = sendWhatsAppMessage($masterPhone, '', $imagePath);
        } else {
            echo json_encode(['success' => false, 'error' => 'Could not generate image']);
            exit;
        }
    } 
    else {
        $imagePath = generateBranchDetailsPNG($agentId);
        $result = sendWhatsAppMessage($masterPhone, $message, $imagePath);
    }
    
    if ($result['success']) {
        echo json_encode([
            'success' => true, 
            'message' => "Report sent successfully to {$masterName}",
            'format' => $format
        ]);
    } else {
        echo json_encode(['success' => false, 'error' => $result['error']]);
    }
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
