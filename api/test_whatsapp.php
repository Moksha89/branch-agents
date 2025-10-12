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

$phone = isset($_POST['phone']) ? sanitizeInput($_POST['phone']) : '';

if (empty($phone)) {
    echo json_encode(['success' => false, 'error' => 'Phone number is required']);
    exit;
}

$message = "*Hisaab Portal - Test Message*\n\n";
$message .= "This is a test message from Hisaab Portal.\n";
$message .= "If you received this, WhatsApp integration is working correctly!\n\n";
$message .= "Date: " . date('d-M-Y h:i A');

$result = sendWhatsAppMessage($phone, $message);

echo json_encode($result);
