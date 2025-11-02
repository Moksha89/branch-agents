<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireAdmin();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$employee_id = intval($_POST['employee_id'] ?? 0);

if ($employee_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid employee ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT is_active FROM employees WHERE id = ?");
    $stmt->execute([$employee_id]);
    $employee = $stmt->fetch();
    
    if (!$employee) {
        echo json_encode(['success' => false, 'error' => 'Employee not found']);
        exit;
    }
    
    $new_status = !$employee['is_active'];
    $stmt = $pdo->prepare("UPDATE employees SET is_active = ? WHERE id = ?");
    $stmt->execute([$new_status, $employee_id]);
    
    $message = $new_status ? 'Employee activated successfully' : 'Employee deactivated successfully';
    echo json_encode(['success' => true, 'message' => $message]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
