<?php
require_once '../config/config.php';
require_once '../config/database.php';

header('Content-Type: application/json');
requireLogin();

if (!isAdmin()) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Only admins can toggle site status']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    $siteId = isset($_POST['site_id']) ? intval($_POST['site_id']) : 0;
    $status = isset($_POST['status']) ? intval($_POST['status']) : 0;
    
    if ($siteId <= 0) {
        echo json_encode(['success' => false, 'error' => 'Invalid site ID']);
        exit;
    }
    
    $stmt = $pdo->prepare("UPDATE sites SET still_active = ? WHERE id = ?");
    $stmt->execute([$status, $siteId]);
    
    $statusText = $status ? 'activated' : 'deactivated';
    echo json_encode(['success' => true, 'message' => "Site $statusText successfully"]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
