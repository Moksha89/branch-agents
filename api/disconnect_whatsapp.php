<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

try {
    $stmt = $pdo->query("SELECT api_url, api_key, session_token FROM whatsapp_config WHERE id = 1");
    $config = $stmt->fetch();
    
    if (!$config) {
        echo json_encode(['success' => false, 'error' => 'WhatsApp configuration not found']);
        exit;
    }
    
    $apiUrl = rtrim($config['api_url'], '/');
    $sessionToken = $config['session_token'];
    $sessionId = 'hisaab_portal';
    
    if (empty($sessionToken)) {
        echo json_encode(['success' => false, 'error' => 'No active WhatsApp session found']);
        exit;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, "$apiUrl/api/v1/sessions/$sessionId");
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $sessionToken
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $stmt = $pdo->prepare("UPDATE whatsapp_config SET session_token = '' WHERE id = 1");
    $stmt->execute();
    
    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode(['success' => true, 'message' => 'WhatsApp disconnected successfully']);
    } else {
        echo json_encode(['success' => true, 'message' => 'WhatsApp disconnected (session cleared from database)']);
    }
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Error: ' . $e->getMessage()]);
}
