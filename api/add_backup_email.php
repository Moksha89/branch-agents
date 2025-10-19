<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!hasBackupTabAccess() && !isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $email = trim($_POST['email']);
    
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'error' => 'Invalid email address']);
        exit;
    }
    
    $stmt = $pdo->prepare("INSERT INTO backup_emails (email) VALUES (?)");
    $stmt->execute([$email]);
    
    echo json_encode(['success' => true, 'message' => 'Email added successfully']);
    
} catch (PDOException $e) {
    if ($e->getCode() == 23000) {
        echo json_encode(['success' => false, 'error' => 'Email already exists']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
