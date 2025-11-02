<?php
require_once '../config/config.php';
require_once '../config/database.php';
requireAdmin();

header('Content-Type: application/json');

$employee_id = intval($_GET['employee_id'] ?? 0);

if ($employee_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid employee ID']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id, name, mobile FROM employees WHERE id = ?");
    $stmt->execute([$employee_id]);
    $employee = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$employee) {
        echo json_encode(['success' => false, 'error' => 'Employee not found']);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT site_id, access_type FROM employee_site_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    $sites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("
        SELECT eba.branch_id, b.site_id 
        FROM employee_branch_access eba 
        JOIN branches b ON eba.branch_id = b.id 
        WHERE eba.employee_id = ?
    ");
    $stmt->execute([$employee_id]);
    $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt = $pdo->prepare("SELECT module_name, access_level FROM employee_module_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'employee' => $employee,
        'sites' => $sites,
        'branches' => $branches,
        'modules' => $modules
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
