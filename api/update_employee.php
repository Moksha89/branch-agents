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
$name = sanitizeInput($_POST['name'] ?? '');
$mobile = sanitizeInput($_POST['mobile'] ?? '');
$password = $_POST['password'] ?? '';
$sites = $_POST['sites'] ?? [];
$modules = $_POST['modules'] ?? [];

if ($employee_id <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid employee ID']);
    exit;
}

if (empty($name) || empty($mobile)) {
    echo json_encode(['success' => false, 'error' => 'Name and mobile number are required']);
    exit;
}

try {
    $pdo->beginTransaction();
    
    if (!empty($password)) {
        if (strlen($password) < 6) {
            echo json_encode(['success' => false, 'error' => 'Password must be at least 6 characters']);
            exit;
        }
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("UPDATE employees SET name = ?, mobile = ?, password = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $mobile, $hashed_password, $employee_id]);
    } else {
        $stmt = $pdo->prepare("UPDATE employees SET name = ?, mobile = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$name, $mobile, $employee_id]);
    }
    
    $stmt = $pdo->prepare("DELETE FROM employee_site_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    
    $stmt = $pdo->prepare("DELETE FROM employee_branch_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    
    $stmt = $pdo->prepare("DELETE FROM employee_module_access WHERE employee_id = ?");
    $stmt->execute([$employee_id]);
    
    if (!empty($sites)) {
        foreach ($sites as $site_id) {
            $access_type = $_POST["site_access_$site_id"] ?? 'all_branches';
            $stmt = $pdo->prepare("INSERT INTO employee_site_access (employee_id, site_id, access_type) VALUES (?, ?, ?)");
            $stmt->execute([$employee_id, $site_id, $access_type]);
            
            if ($access_type === 'limited_branches' && isset($_POST["branches_$site_id"])) {
                $branches = $_POST["branches_$site_id"];
                $stmt = $pdo->prepare("INSERT INTO employee_branch_access (employee_id, branch_id) VALUES (?, ?)");
                foreach ($branches as $branch_id) {
                    $stmt->execute([$employee_id, $branch_id]);
                }
            }
        }
    }
    
    if (!empty($modules)) {
        foreach ($modules as $module) {
            $access_level = $_POST["module_access_$module"] ?? 'read';
            $stmt = $pdo->prepare("INSERT INTO employee_module_access (employee_id, module_name, access_level) VALUES (?, ?, ?)");
            $stmt->execute([$employee_id, $module, $access_level]);
        }
    }
    
    $pdo->commit();
    echo json_encode(['success' => true, 'message' => 'Employee updated successfully']);
} catch (PDOException $e) {
    $pdo->rollBack();
    if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
        echo json_encode(['success' => false, 'error' => 'Mobile number already exists']);
    } else {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}
