<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireLogin();

header('Content-Type: application/json');

$site_id = intval($_GET['site_id'] ?? 0);

if ($site_id <= 0) {
    echo json_encode([]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, branch_code FROM branches WHERE site_id = ? ORDER BY branch_code");
    $stmt->execute([$site_id]);
    $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode($branches);
} catch (PDOException $e) {
    echo json_encode([]);
}
